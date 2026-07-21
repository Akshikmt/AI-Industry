import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import {
  ArrowLeft,
  Clock,
  FileText,
  Send,
  Loader2,
  Sparkles,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

interface Asset {
  id: string;
  assetName: string;
  equipmentTag: string;
  department: string;
  createdAt: string;
}

interface LinkedDocument {
  id: string;
  title: string;
  fileUrl: string;
}

interface TimelineEvent {
  date: string;
  event: string;
  description: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const renderFormattedSummary = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');

  return (
    <div className="space-y-2.5 text-xs leading-relaxed text-dark-text font-sans">
      {lines.map((line, lineIdx) => {
        let raw = line.trim();
        if (!raw) return null;

        // Check if bullet line
        const isBullet = /^\s*[\*\-\•]\s*/.test(raw);
        // Strip leading bullet tokens
        let content = raw.replace(/^\s*[\*\-\•]\s*/, '');

        let label = '';
        let body = content;

        // Key-value label split by colon
        if (content.includes(':')) {
          const colonIdx = content.indexOf(':');
          const rawLabel = content.substring(0, colonIdx + 1);
          const rawBody = content.substring(colonIdx + 1);

          label = rawLabel.replace(/[\*\_`]/g, '').trim();
          body = rawBody.replace(/[\*\_`]/g, '').trim();
        } else {
          body = content.replace(/[\*\_`]/g, '').trim();
        }

        // Section header without body (e.g., "**Centrifugal Water Pump (P-101) Engineering Summary:**")
        if (label && !body) {
          return (
            <div key={lineIdx} className="pt-1 pb-0.5 border-b border-dark-border/40 mb-1">
              <span className="font-extrabold text-white text-sm block">{label}</span>
            </div>
          );
        }

        // Bullet item with bold label
        if (isBullet && label) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-teal mt-1.5 shrink-0" />
              <div className="flex-1">
                <span className="font-extrabold text-white mr-1.5">{label}</span>
                <span className="text-dark-text font-medium">{body}</span>
              </div>
            </div>
          );
        }

        // Standard bullet item without label
        if (isBullet) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-teal mt-1.5 shrink-0" />
              <div className="flex-1 text-white font-medium">{body}</div>
            </div>
          );
        }

        // Header or standalone bold paragraph
        return (
          <p key={lineIdx} className="font-bold text-white">
            {label ? <span className="font-extrabold text-white mr-1.5">{label}</span> : null}
            {body}
          </p>
        );
      })}
    </div>
  );
};

const renderChatMessage = (content: string) => {
  if (!content) return null;
  const parts = content.split(/(\*\*.*?\*\*|`[^`]+`)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-extrabold text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <span key={i} className="font-mono text-accent-teal px-1 py-0.5 rounded bg-dark-bg/80 border border-dark-border">
              {part.slice(1, -1)}
            </span>
          );
        }
        return part.replace(/`/g, '');
      })}
    </span>
  );
};

const AssetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Data States
  const [asset, setAsset] = useState<Asset | null>(null);
  const [aiSummary, setAiSummary] = useState('');
  const [relatedDocs, setRelatedDocs] = useState<LinkedDocument[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Locked Chat States
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchAssetDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/assets/${id}`);
      setAsset(data.asset);
      setAiSummary(data.aiSummary);
      setRelatedDocs(data.relatedDocuments);
      setTimeline(data.timeline);

      // Seed initial chat greetings
      setChatMessages([
        {
          role: 'assistant',
          content: `Hi! I am the AI Copilot. Ask me questions locked specifically to **${data.asset.assetName} (${data.asset.equipmentTag})**. I will only reference context from documents associated with this asset.`
        }
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to load asset specs.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssetDetails();
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  // Locked chat submit
  const handleChatSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading || !asset) return;

    const userText = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userText }]);
    setChatLoading(true);

    try {
      const data = await apiFetch('/copilot/ask', {
        method: 'POST',
        body: JSON.stringify({
          question: userText,
          assetTag: asset.equipmentTag // Lock context to this asset's tag!
        })
      });

      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.answer }
      ]);
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Error: ${err.message || 'Failed to fetch query response.'}` }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-dark-muted">
        <Loader2 className="w-8 h-8 animate-spin text-accent-teal" />
        <p className="text-xs mt-2 font-semibold animate-pulse font-sans">Compiling asset specifications & timeline logs...</p>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="p-6 text-center text-xs text-accent-rose flex flex-col items-center justify-center gap-3">
        <AlertTriangle className="w-8 h-8" />
        <span>{error || 'Asset not found.'}</span>
        <Link to="/dashboard/assets" className="text-accent-teal hover:underline text-xs flex items-center gap-1 mt-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Assets
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back & Title Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/dashboard/assets"
          className="p-1.5 rounded-lg border border-dark-border bg-dark-card hover:border-accent-teal text-dark-muted hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <span className="text-[10px] uppercase font-bold text-accent-teal tracking-widest font-sans">{asset.department} Department</span>
          <h1 className="text-[1.5rem] font-extrabold text-white font-sans flex items-center gap-2 mt-0.5">
            {asset.assetName}
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-dark-bg border border-dark-border text-dark-muted font-bold font-mono">
              {asset.equipmentTag}
            </span>
          </h1>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (AI Summary & Timeline) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Dynamic AI Summary */}
          <div className="glassmorphism p-6 rounded-xl space-y-4">
            <h3 className="font-extrabold text-sm text-white font-sans">
              AI Asset Engineering Summary
            </h3>
            <div className="p-4 rounded-lg bg-dark-bg/60 border border-dark-border/40 text-xs leading-relaxed text-dark-text font-sans">
              {renderFormattedSummary(aiSummary)}
            </div>
          </div>

          {/* Maintenance Chronological Timeline */}
          <div className="glassmorphism p-6 rounded-xl space-y-4">
            <h3 className="font-extrabold text-sm text-white font-sans flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent-teal" />
              Chronological Maintenance Logs
            </h3>

            {timeline.length === 0 ? (
              <div className="text-xs text-dark-muted py-4 text-center">
                No past maintenance logs found for this equipment.
              </div>
            ) : (
              <div className="relative border-l border-dark-border/80 ml-3.5 pl-6 space-y-6 py-2">
                {timeline.map((event, idx) => {
                  const isIncident = event.event.includes('INCIDENT') || event.description.includes('overheating') || event.description.includes('spike');
                  return (
                    <div key={idx} className="relative group">
                      {/* Timeline Dot icon */}
                      <span className={`absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-dark-bg flex items-center justify-center ${isIncident ? 'bg-accent-rose shadow-glow-rose' : 'bg-accent-teal shadow-glow-teal'
                        }`} />

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-dark-muted font-bold font-mono">
                            {new Date(event.date).toLocaleDateString()} {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${isIncident
                              ? 'bg-accent-rose/5 text-accent-rose border-accent-rose/20'
                              : 'bg-accent-teal/5 text-accent-teal border-accent-teal/20'
                            }`}>
                            {event.event}
                          </span>
                        </div>
                        <p className="text-xs text-white font-sans font-semibold">{event.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Linked Documents & Locked Chat Assistant) */}
        <div className="space-y-6">

          {/* Associated Documents */}
          <div className="glassmorphism p-6 rounded-xl space-y-4">
            <h3 className="font-extrabold text-sm text-white font-sans flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent-teal" />
              Linked Technical Manuals
            </h3>

            {relatedDocs.length === 0 ? (
              <div className="text-xs text-dark-muted py-4 text-center">
                No manuals mention this asset tag.
              </div>
            ) : (
              <div className="space-y-2">
                {relatedDocs.map(doc => (
                  <a
                    key={doc.id}
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg border border-dark-border bg-dark-bg/40 hover:bg-dark-border/80 text-xs text-white transition-all"
                  >
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      <FileText className="w-4 h-4 text-accent-teal shrink-0" />
                      <span className="truncate font-bold font-sans">{doc.title}</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-dark-muted hover:text-white" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Locked Chat widget */}
          <div className="glassmorphism p-6 rounded-xl space-y-4 flex flex-col h-[340px] justify-between">
            <h3 className="font-extrabold text-sm text-white font-sans flex items-center gap-2 pb-2 border-b border-dark-border">
              <Sparkles className="w-4 h-4 text-accent-teal" />
              Locked Asset Assistant
            </h3>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-3.5 py-2 pr-1 scrollbar-thin">
              {chatMessages.map((msg, index) => {
                const isAssistant = msg.role === 'assistant';
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg text-[11px] leading-relaxed ${isAssistant
                        ? 'bg-dark-bg/60 border border-dark-border text-dark-text'
                        : 'bg-accent-teal/10 border border-accent-teal/20 text-white ml-6'
                      }`}
                  >
                    <span className="text-[8px] font-bold uppercase tracking-wider block mb-1 text-dark-muted">
                      {isAssistant ? 'AI Copilot' : 'You'}
                    </span>
                    {renderChatMessage(msg.content)}
                  </div>
                );
              })}
              {chatLoading && (
                <div className="p-3 rounded-lg bg-dark-bg/60 border border-dark-border text-[11px] text-dark-muted flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin text-accent-teal" />
                  Searching local index...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleChatSend} className="flex gap-2 pt-2 border-t border-dark-border/40">
              <input
                type="text"
                placeholder={`Ask about ${asset.equipmentTag}...`}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={chatLoading}
                className="flex-1 px-3 py-2 rounded-md border border-dark-border bg-dark-bg text-[11px] text-white placeholder-dark-muted outline-none focus:border-accent-teal transition-all"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="p-2 rounded-md bg-accent-teal text-dark-bg hover:shadow-glow-teal font-bold transition-all disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AssetDetailPage;
