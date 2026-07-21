import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import {
  Send,
  AlertTriangle,
  ShieldCheck,
  Cpu,
  Loader2,
  Plus,
  MessageSquare,
  Trash2,
  History,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Citation {
  docTitle: string;
  fileUrl: string;
  excerpt: string;
  sectionName?: string;
}

interface RelatedAsset {
  id: string;
  assetName: string;
  equipmentTag: string;
  department: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  confidence?: number;
  citations?: Citation[];
  relatedAssets?: RelatedAsset[];
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
}

const DEFAULT_GREETING: Message = {
  role: 'assistant',
  content: 'Hello! I am the SamiQ Copilot. Ask me questions about industrial equipment parameters, failure histories, standard operating procedures (SOPs), or logs. All my answers are mathematically grounded in your ingested documents to prevent hallucinations.',
  confidence: 1.0,
  citations: [],
  relatedAssets: []
};

const CopilotPage: React.FC = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Chat Sessions & History States (Persisted in localStorage)
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('samiq_copilot_chats');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse saved copilot sessions:', e);
    }
    const defaultSession: ChatSession = {
      id: 'session-default',
      title: 'Welcome Chat',
      createdAt: new Date().toISOString(),
      messages: [DEFAULT_GREETING]
    };
    return [defaultSession];
  });

  const [activeChatId, setActiveChatId] = useState<string>(() => sessions[0]?.id || 'session-default');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Active Session messages
  const activeSession = sessions.find(s => s.id === activeChatId) || sessions[0];
  const messages = activeSession?.messages || [DEFAULT_GREETING];

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save sessions to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem('samiq_copilot_chats', JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save copilot sessions:', e);
    }
  }, [sessions]);

  // Auto-scroll messages to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Create a New Chat Session
  const handleCreateNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      createdAt: new Date().toISOString(),
      messages: [DEFAULT_GREETING]
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveChatId(newSession.id);
    setError(null);
  };

  // Delete a Chat Session
  const handleDeleteChat = (e: React.MouseEvent, chatIdToDelete: string) => {
    e.stopPropagation();
    const filtered = sessions.filter(s => s.id !== chatIdToDelete);
    if (filtered.length === 0) {
      const freshSession: ChatSession = {
        id: Date.now().toString(),
        title: 'New Chat',
        createdAt: new Date().toISOString(),
        messages: [DEFAULT_GREETING]
      };
      setSessions([freshSession]);
      setActiveChatId(freshSession.id);
    } else {
      setSessions(filtered);
      if (activeChatId === chatIdToDelete) {
        setActiveChatId(filtered[0].id);
      }
    }
  };

  // Handle Submit Form
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setError(null);

    // Check if first user message in this session to auto-name chat
    const currentSession = sessions.find(s => s.id === activeChatId);
    const hasUserMsg = currentSession?.messages.some(m => m.role === 'user');

    let updatedTitle = currentSession?.title || 'Chat';
    if (!hasUserMsg || currentSession?.title === 'New Chat' || currentSession?.title === 'Welcome Chat') {
      // Auto-name title based on the first user text prompt
      updatedTitle = userText.length > 30 ? `${userText.substring(0, 30)}...` : userText;
    }

    const newUserMsg: Message = { role: 'user', content: userText };

    // Update state locally with user message & updated title
    setSessions(prev =>
      prev.map(s =>
        s.id === activeChatId
          ? {
            ...s,
            title: updatedTitle,
            messages: [...s.messages, newUserMsg]
          }
          : s
      )
    );

    setLoading(true);

    try {
      const response = await apiFetch('/copilot/ask', {
        method: 'POST',
        body: JSON.stringify({ question: userText })
      });

      const newAssistantMsg: Message = {
        role: 'assistant',
        content: response.answer,
        confidence: response.confidence,
        citations: response.citations,
        relatedAssets: response.relatedAssets
      };

      setSessions(prev =>
        prev.map(s =>
          s.id === activeChatId
            ? { ...s, messages: [...s.messages, newAssistantMsg] }
            : s
        )
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to retrieve response from Copilot.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to parse simple markdown bold tags (**text**) and code tags (`text`) without showing raw backticks
  const renderFormattedContent = (content: string) => {
    if (!content) return null;
    const parts = content.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-extrabold text-accent-teal">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <span key={index} className="font-mono text-accent-teal px-1 py-0.5 rounded bg-dark-bg/80 border border-dark-border">{part.slice(1, -1)}</span>;
      }
      return part.replace(/`/g, '');
    });
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex gap-4 overflow-hidden font-sans">
      {/* Side Panel: Chat History */}
      <div
        className={`glassmorphism rounded-2xl p-4 border border-dark-border flex flex-col justify-between transition-all duration-300 shrink-0 ${isSidebarOpen ? 'w-64 md:w-72' : 'w-16 items-center'
          }`}
      >
        <div className="space-y-4 overflow-hidden flex-1 flex flex-col">
          {/* New Chat Button */}
          <button
            onClick={handleCreateNewChat}
            className={`w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-accent-teal to-accent-blue hover:from-accent-tealHover hover:to-accent-blue text-[#ffffff] text-xs font-bold shadow-glow-teal flex items-center justify-center gap-2 cursor-pointer transition-all ${!isSidebarOpen && 'p-2.5'
              }`}
            title="Create New Chat"
          >
            <Plus className="w-4 h-4 text-[#ffffff] shrink-0" />
            {isSidebarOpen && <span className="text-[#ffffff]">New Chat</span>}
          </button>

          {/* History Header */}
          {isSidebarOpen && (
            <div className="flex items-center justify-between pt-2 px-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-dark-muted flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-accent-teal" />
                Chat History
              </span>
              <span className="text-[10px] font-bold text-dark-muted bg-dark-bg px-2 py-0.5 rounded-full border border-dark-border">
                {sessions.length}
              </span>
            </div>
          )}

          {/* Chat Sessions List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
            {sessions.map((s) => {
              const isActive = s.id === activeChatId;
              return (
                <div
                  key={s.id}
                  onClick={() => setActiveChatId(s.id)}
                  className={`group flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer border ${isActive
                      ? 'bg-accent-teal/10 border-accent-teal/30 text-white font-bold shadow-sm'
                      : 'border-transparent hover:bg-dark-bg/60 text-dark-muted hover:text-white'
                    }`}
                  title={s.title}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare
                      className={`w-4 h-4 shrink-0 ${isActive ? 'text-accent-teal' : 'text-dark-muted group-hover:text-white'
                        }`}
                    />
                    {isSidebarOpen && (
                      <span className="truncate max-w-[170px] text-xs leading-snug">
                        {s.title}
                      </span>
                    )}
                  </div>

                  {isSidebarOpen && (
                    <button
                      onClick={(e) => handleDeleteChat(e, s.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 rounded transition-all cursor-pointer text-dark-muted"
                      title="Delete Chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Toggle Sidebar Collapse */}
        <div className="pt-3 border-t border-dark-border/40 flex justify-end">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg border border-dark-border bg-dark-bg hover:border-accent-teal text-dark-muted hover:text-white transition-all cursor-pointer"
            title={isSidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
          >
            {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Conversation Window */}
      <div className="flex-1 glassmorphism rounded-2xl p-6 border border-dark-border flex flex-col justify-between overflow-hidden">
        {/* Active Chat Header */}
        <div className="pb-4 border-b border-dark-border flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-base font-extrabold text-white font-sans truncate max-w-xl">
              {activeSession.title}
            </h1>
            <p className="text-[11px] text-dark-muted mt-0.5">Grounding engine powered by Gemini 2.5 Flash</p>
          </div>

          <span className="text-[10px] font-bold text-accent-teal bg-accent-teal/10 border border-accent-teal/20 px-2.5 py-1 rounded-lg">
            Active Chat
          </span>
        </div>

        {/* Messages Box */}
        <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-2 scrollbar-thin">
          <div className="space-y-6">
            {messages.map((msg, index) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={index}
                  className={`flex flex-col max-w-[85%] rounded-xl p-5 text-xs relative ${isAssistant
                      ? 'bg-dark-card border border-dark-border self-start text-dark-text shadow-sm'
                      : 'bg-accent-teal/10 border border-accent-teal/20 self-end text-white ml-auto'
                    }`}
                >
                  {/* User vs Bot label */}
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider mb-1.5 block ${isAssistant ? 'text-accent-teal' : 'text-dark-muted'
                      }`}
                  >
                    {isAssistant ? 'AI Copilot' : 'You'}
                  </span>

                  {/* Content */}
                  <p className="leading-relaxed font-sans whitespace-pre-wrap">{renderFormattedContent(msg.content)}</p>

                  {/* Assistant metadata (Citations, confidence, assets) */}
                  {isAssistant && index > 0 && (
                    <div className="mt-4 pt-4 border-t border-dark-border/40 space-y-3.5">
                      {/* Confidence Indicator */}
                      {msg.confidence !== undefined && (
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-dark-muted font-bold uppercase">Confidence:</span>
                          <span
                            className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase border px-2 py-0.5 rounded ${msg.confidence >= 0.8
                                ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20'
                                : msg.confidence >= 0.4
                                  ? 'bg-accent-amber/5 text-accent-amber border-accent-amber/20'
                                  : 'bg-accent-rose/5 text-accent-rose border-accent-rose/20'
                              }`}
                          >
                            {msg.confidence >= 0.8 && <ShieldCheck className="w-3 h-3" />}
                            {msg.confidence < 0.8 && msg.confidence > 0 && <AlertTriangle className="w-3 h-3" />}
                            {msg.confidence === 0 && <AlertTriangle className="w-3 h-3" />}

                            {msg.confidence >= 0.8
                              ? 'High'
                              : msg.confidence >= 0.4
                                ? 'Medium'
                                : msg.confidence > 0
                                  ? 'Low'
                                  : 'Unverified (No matching document context)'}
                          </span>
                        </div>
                      )}

                      {/* Citations badges */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[9px] text-dark-muted font-bold uppercase block">Source Citations:</span>
                          <div className="flex flex-col gap-1 mt-1">
                            {msg.citations.map((cite, i) => (
                              <div key={i} className="text-[10px] text-dark-text font-sans font-semibold">
                                Source:{' '}
                                <a
                                  href={cite.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-accent-teal hover:underline font-mono"
                                  title={cite.excerpt}
                                >
                                  {cite.docTitle}
                                </a>
                                <span className="text-dark-muted font-normal"> → {cite.sectionName || 'General Content'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Related Assets shortcuts */}
                      {msg.relatedAssets && msg.relatedAssets.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[9px] text-dark-muted font-bold uppercase block">Linked Equipment:</span>
                          <div className="flex flex-wrap gap-2">
                            {msg.relatedAssets.map((asset) => (
                              <button
                                key={asset.id}
                                onClick={() => navigate(`/dashboard/assets/${asset.id}`)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-accent-teal/5 border border-accent-teal/20 text-white hover:bg-accent-teal/15 hover:border-accent-teal/40 font-sans text-[9px] font-bold transition-all cursor-pointer"
                              >
                                <Cpu className="w-3 h-3 text-accent-teal" />
                                {asset.assetName} ({asset.equipmentTag})
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="bg-dark-card border border-dark-border max-w-[85%] rounded-xl p-5 self-start flex items-center gap-3 text-xs text-dark-muted shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-accent-teal" />
                <span className="font-semibold animate-pulse">Running semantic retrieval and RAG query...</span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-4 rounded-lg border border-accent-rose/20 bg-accent-rose/5 text-xs text-accent-rose max-w-[85%]">
                <AlertTriangle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="pt-4 border-t border-dark-border flex gap-3 shrink-0">
          <input
            type="text"
            placeholder="Ask a question about Pump P-101 failure, turbine vibration, lubrication specifications..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-lg border border-dark-border bg-dark-card/50 text-xs text-white placeholder-dark-muted focus:border-accent-teal focus:ring-1 focus:ring-accent-teal outline-none transition-all"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-3 rounded-lg bg-gradient-to-r from-accent-teal to-accent-blue text-white hover:shadow-glow-teal font-bold flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default CopilotPage;
