import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../utils/api';
import {
  FileText,
  UploadCloud,
  Trash2,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Eye,
  X,
  Search,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Filter,
  FilePlus,
  CheckCircle2
} from 'lucide-react';

interface Document {
  id: string;
  title: string;
  fileUrl: string;
  fileType: string;
  uploadedBy: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  extractedText?: string;
  createdAt: string;
}

interface SearchResult {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  documentUrl: string;
  chunkText: string;
  pageNumber: number;
  score: number;
  searchMethod: string;
}

const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Tab State
  const [activeTab, setActiveTab] = useState<'repository' | 'search'>('repository');

  // Repository Data States
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Multi-file Upload States
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Catalog Search & Filter States
  const [catalogSearch, setCatalogSearch] = useState('');
  const [formatFilter, setFormatFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');

  // Preview Drawer State
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  // Delete Confirmation Modal State
  const [deletingDoc, setDeletingDoc] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Semantic Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchMeta, setSearchMeta] = useState({ mode: 'keyword_fallback', count: 0 });

  // Filtered documents calculation
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesTitle = doc.title.toLowerCase().includes(catalogSearch.toLowerCase());
      const matchesFormat = formatFilter === 'All' || (doc.fileType && doc.fileType.toLowerCase().includes(formatFilter.toLowerCase()));

      let matchesDate = true;
      if (dateFilter === 'today') {
        const docDate = new Date(doc.createdAt).toDateString();
        const today = new Date().toDateString();
        matchesDate = docDate === today;
      } else if (dateFilter === 'week') {
        const docTime = new Date(doc.createdAt).getTime();
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        matchesDate = docTime >= sevenDaysAgo;
      } else if (dateFilter === 'month') {
        const docTime = new Date(doc.createdAt).getTime();
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        matchesDate = docTime >= thirtyDaysAgo;
      }

      return matchesTitle && matchesFormat && matchesDate;
    });
  }, [documents, catalogSearch, formatFilter, dateFilter]);

  // Load documents catalog
  const loadDocuments = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      setError(null);
      const data = await apiFetch('/documents');
      setDocuments(data.documents);
    } catch (err: any) {
      setError('Failed to fetch document catalog.');
      console.error(err);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  // Auto-polling for active document extractions (every 4 seconds)
  useEffect(() => {
    const activeProcessing = documents.some(
      doc => doc.status === 'pending' || doc.status === 'processing'
    );

    if (activeProcessing) {
      const interval = setInterval(() => {
        loadDocuments(false); // Silent reload in background
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [documents]);

  // Handle Drag & Drop Upload (Multi-file)
  const [isDragActive, setIsDragActive] = useState(false);
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...droppedFiles]);
      setUploadError(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
      setUploadError(null);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;

    setUploading(true);
    setUploadError(null);

    let successCount = 0;
    let duplicateCount = 0;
    let failCount = 0;

    for (const singleFile of files) {
      const isDuplicate = documents.some(d => d.title.toLowerCase().trim() === singleFile.name.toLowerCase().trim());
      if (isDuplicate) {
        duplicateCount++;
        continue;
      }

      const formData = new FormData();
      formData.append('file', singleFile);

      try {
        await apiFetch('/documents/upload', {
          method: 'POST',
          body: formData
        });
        successCount++;
      } catch (err: any) {
        if (err.message && err.message.toLowerCase().includes('duplicate')) {
          duplicateCount++;
        } else {
          failCount++;
          console.error(`Failed to upload ${singleFile.name}:`, err);
        }
      }
    }

    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    await loadDocuments(false);
    setUploading(false);

    if (successCount > 0) {
      showToast(`${successCount} document(s) uploaded & vectorized successfully!`, 'success');
    }

    if (duplicateCount > 0 || failCount > 0) {
      setUploadError(
        `Uploaded ${successCount} file(s) successfully. ${duplicateCount > 0 ? `${duplicateCount} duplicate document(s) skipped with warning.` : ''} ${failCount > 0 ? `${failCount} file(s) failed.` : ''}`
      );
    }
  };

  // Confirm Delete Handler
  const handleConfirmDelete = async () => {
    if (!deletingDoc) return;
    setIsDeleting(true);

    try {
      await apiFetch(`/documents/${deletingDoc.id}`, {
        method: 'DELETE'
      });
      showToast(`Document "${deletingDoc.title}" deleted successfully.`, 'info');
      setDocuments(prev => prev.filter(doc => doc.id !== deletingDoc.id));
      if (previewDoc?.id === deletingDoc.id) setPreviewDoc(null);
      setDeletingDoc(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete document.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Semantic Search handler
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchError(null);
    try {
      const data = await apiFetch('/search', {
        method: 'POST',
        body: JSON.stringify({ query: searchQuery })
      });
      setSearchResults(data.results);
      setSearchMeta({ mode: data.mode, count: data.count });
    } catch (err: any) {
      setSearchError(err.message || 'Search execution failed.');
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Tab Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-border pb-4">
        <div>
          <h1 className="text-[1.5rem] font-extrabold text-white font-sans">Knowledge Repository</h1>
          <p className="text-xs text-dark-muted mt-1">Manage workspace documents and search within file contents</p>
        </div>

        <div className="flex bg-dark-card p-1 rounded-lg border border-dark-border">
          <button
            onClick={() => setActiveTab('repository')}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${activeTab === 'repository'
                ? 'bg-accent-teal text-white shadow-md'
                : 'text-dark-muted hover:text-white'
              }`}
          >
            Documents Catalog
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${activeTab === 'search'
                ? 'bg-accent-teal text-white shadow-md'
                : 'text-dark-muted hover:text-white'
              }`}
          >
            Smart Search
          </button>
        </div>
      </div>

      {activeTab === 'repository' ? (
        /* ==================== DOCUMENTS CATALOG TAB ==================== */
        <div className="space-y-8 animate-fadeIn">
          {user?.role === 'admin' && (
            <div className="glassmorphism p-6 rounded-xl space-y-4">
              <h3 className="font-extrabold text-sm text-white font-sans flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-accent-teal" />
                Upload & Ingest Documents
              </h3>

              <form onSubmit={handleUpload} className="space-y-4">
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragActive
                      ? 'border-accent-teal bg-accent-teal/5 shadow-glow-teal'
                      : 'border-dark-border bg-dark-bg/40 hover:border-accent-teal/30 hover:bg-accent-teal/5'
                    }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.xlsx,.xls"
                    multiple
                  />
                  <UploadCloud className="w-10 h-10 mx-auto text-dark-muted" />
                  {files.length > 0 ? (
                    <div className="mt-3 space-y-3">
                      <p className="text-xs font-bold text-white">{files.length} document(s) selected for upload:</p>

                      {/* Duplicate Document Warning Alert (Red Text, No Background Box) */}
                      {files.some(f => documents.some(d => d.title.toLowerCase().trim() === f.name.toLowerCase().trim())) && (
                        <div className="flex items-center justify-center gap-2 py-1 text-rose-500 text-xs font-bold max-w-xl mx-auto text-center font-sans">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                          <span>Warning: One or more selected files already exist in your catalog. Duplicate files will be skipped.</span>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 justify-center max-h-36 overflow-y-auto p-1">
                        {files.map((f, i) => {
                          const isDuplicate = documents.some(d => d.title.toLowerCase().trim() === f.name.toLowerCase().trim());
                          return (
                            <span
                              key={i}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium bg-dark-card ${
                                isDuplicate
                                  ? 'border-rose-500/40 text-rose-400'
                                  : 'border-dark-border text-white'
                              }`}
                            >
                              <FileText className={`w-3.5 h-3.5 ${isDuplicate ? 'text-rose-500' : 'text-accent-teal'}`} />
                              <span className="truncate max-w-[180px]">{f.name}</span>
                              <span className="text-[10px] text-dark-muted">({(f.size / 1024 / 1024).toFixed(1)}MB)</span>
                              {isDuplicate && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold text-rose-500 border border-rose-500/30">
                                  Duplicate
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleRemoveFile(i); }}
                                className="text-dark-muted hover:text-rose-400 p-0.5 cursor-pointer ml-1"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <p className="text-xs font-bold text-white">Drag & drop multiple files here, or click to browse</p>
                      <p className="text-[10px] text-dark-muted mt-1">Select many files at once: PDF, DOCX, TXT, Excel, PNG, JPG (Max 10MB each)</p>
                    </div>
                  )}
                </div>

                {uploadError && (
                  <div className="flex items-center justify-center gap-2 py-1 text-xs text-rose-500 font-bold font-sans">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {files.length > 0 && (
                  <div className="flex gap-3 justify-end items-center">
                    <button
                      type="button"
                      onClick={() => setFiles([])}
                      disabled={uploading}
                      className="px-4 py-2 text-xs font-semibold text-dark-muted hover:text-white transition-all cursor-pointer"
                    >
                      Clear Selection
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-accent-teal to-accent-blue text-[#ffffff] text-xs font-bold shadow-glow-teal hover:shadow-glow-teal-strong flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Uploading {files.length} File(s)...
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4" />
                          <span>Upload {files.length} Document(s)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          <div className="glassmorphism rounded-xl overflow-hidden">
            <div className="p-6 border-b border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-white font-sans">Document Catalog</h3>
                <p className="text-xs text-dark-muted mt-0.5">Total Ingested: {filteredDocuments.length} document(s)</p>
              </div>

              <button
                onClick={() => loadDocuments(true)}
                className="text-[10px] uppercase font-bold text-accent-teal hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh Catalog
              </button>
            </div>

            {/* Catalog Search Bar & Filters */}
            <div className="p-4 border-b border-dark-border bg-dark-card/40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-dark-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search documents by name..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-dark-bg border border-dark-border focus:border-accent-teal text-xs text-white placeholder-dark-muted outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-dark-muted" />
                  <span className="text-xs font-bold text-dark-muted">Format:</span>
                  <select
                    value={formatFilter}
                    onChange={(e) => setFormatFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-dark-bg border border-dark-border text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="All">All Formats</option>
                    <option value="pdf">PDF</option>
                    <option value="docx">Word (.docx)</option>
                    <option value="txt">Text (.txt)</option>
                    <option value="xls">Excel (.xlsx)</option>
                    <option value="image">Images</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-dark-muted">Date:</span>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-dark-bg border border-dark-border text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="All">All Time</option>
                    <option value="today">Uploaded Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-dark-muted">
                <Loader2 className="w-8 h-8 animate-spin text-accent-teal" />
                <p className="text-xs mt-2 font-semibold">Synchronizing documents repository...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-xs text-accent-rose flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="py-12 text-center text-xs text-dark-muted">
                {catalogSearch || formatFilter !== 'All' || dateFilter !== 'All'
                  ? 'No documents matched your search query and filters.'
                  : 'No documents ingested yet. Upload files above to begin pipeline extraction.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-dark-border text-dark-muted font-bold uppercase tracking-wider">
                      <th className="py-4 pl-6">Document Title</th>
                      <th className="py-4">Status</th>
                      <th className="py-4">Uploaded By</th>
                      <th className="py-4">Created At</th>
                      <th className="py-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border/40">
                    {filteredDocuments.map((doc) => (
                      <tr key={doc.id} className="hover:bg-dark-border/20 transition-all">
                        <td className="py-4 pl-6 font-bold text-white font-sans">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-dark-border border border-dark-border flex items-center justify-center text-dark-muted shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="truncate max-w-xs sm:max-w-md">
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-accent-teal hover:underline block truncate"
                              >
                                {doc.title}
                              </a>
                              <span className="text-[10px] text-dark-muted font-normal uppercase block mt-0.5">{doc.fileType}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4">
                          {doc.status === 'ready' && (
                            <span className="inline-flex items-center gap-2 text-xs font-bold text-accent-blue font-sans">
                              <span className="w-2 h-2 rounded-full bg-accent-blue shrink-0" />
                              Active & Ready
                            </span>
                          )}
                          {doc.status === 'processing' && (
                            <span className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 font-sans">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Processing...
                            </span>
                          )}
                          {doc.status === 'pending' && (
                            <span className="inline-flex items-center gap-2 text-xs font-bold text-dark-muted font-sans">
                              <Clock className="w-3.5 h-3.5" />
                              Queued
                            </span>
                          )}
                          {doc.status === 'failed' && (
                            <span className="inline-flex items-center gap-2 text-xs font-bold text-rose-400 font-sans">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Failed
                            </span>
                          )}
                        </td>

                        <td className="py-4 text-dark-muted font-mono">{doc.uploadedBy}</td>
                        <td className="py-4 text-dark-muted">{new Date(doc.createdAt).toLocaleDateString()}</td>

                        <td className="py-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-3.5">
                            {doc.status === 'ready' && (
                              <button
                                onClick={() => setPreviewDoc(doc)}
                                className="text-dark-muted hover:text-accent-teal flex items-center gap-1 font-bold text-[11px] transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                View Text
                              </button>
                            )}

                            {user?.role === 'admin' && (
                              <button
                                onClick={() => setDeletingDoc(doc)}
                                title="Delete document"
                                className="text-rose-500 hover:text-rose-400 p-1.5 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 text-rose-500" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ==================== SMART SEARCH TAB ==================== */
        <div className="space-y-6 animate-fadeIn">
          <div className="glassmorphism p-6 rounded-xl space-y-4">
            <h3 className="font-extrabold text-sm text-white font-sans flex items-center gap-2">
              <Search className="w-4 h-4 text-accent-teal" />
              Smart Content Search
            </h3>
            <p className="text-xs text-dark-muted">
              Search for topics, key terms, equipment parameters, or safety guidelines across all uploaded documents.
            </p>

            <form onSubmit={handleSearchSubmit} className="flex gap-3">
              <input
                type="text"
                placeholder="Search by topic, safety guidelines, equipment manuals, or key terms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={searching}
                className="flex-1 px-4 py-3 rounded-lg border border-dark-border bg-dark-bg text-xs text-white placeholder-dark-muted focus:border-accent-teal focus:ring-1 focus:ring-accent-teal outline-none transition-all"
              />
              <button
                type="submit"
                disabled={searching || !searchQuery.trim()}
                className="px-5 py-3 rounded-lg bg-gradient-to-r from-accent-teal to-accent-blue text-[#ffffff] hover:shadow-glow-teal font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-40"
              >
                {searching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    Search
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {searchError && (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-accent-rose/20 bg-accent-rose/5 text-xs text-accent-rose">
                <AlertTriangle className="w-4 h-4" />
                <span>{searchError}</span>
              </div>
            )}
          </div>

          {/* Search Result Listing */}
          <div className="space-y-4">
            {searchResults.length > 0 && (
              <div className="flex justify-between items-center px-2">
                <span className="text-[10px] text-dark-muted uppercase font-bold tracking-wider">
                  Top Relevant Context Matches ({searchMeta.count} found)
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent-teal uppercase tracking-wider bg-accent-teal/5 border border-accent-teal/20 px-2 py-0.5 rounded">
                  <ShieldCheck className="w-3 h-3" />
                  Mode: {searchMeta.mode === 'semantic' ? 'Industrial Vector Embeddings' : 'Local TF-IDF Fallback'}
                </span>
              </div>
            )}

            {searching ? (
              <div className="py-16 text-center text-dark-muted">
                <Loader2 className="w-8 h-8 animate-spin text-accent-teal mx-auto" />
                <p className="text-xs mt-2 font-semibold">Running cosine similarity vectors calculation...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="glassmorphism p-12 text-center text-xs text-dark-muted rounded-xl">
                {searchQuery ? 'No matched snippets found for your query.' : 'Type a query above to search documents semantically.'}
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults.map((result, idx) => (
                  <div
                    key={result.chunkId}
                    className="glassmorphism p-5 rounded-xl border-l-4 border-l-accent-teal relative group hover:border-dark-border transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-[10px] text-dark-muted font-bold uppercase">Source Document</span>
                        <a
                          href={result.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-white hover:text-accent-teal hover:underline flex items-center gap-1.5 mt-0.5"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-accent-teal shrink-0" />
                          {result.documentTitle}
                        </a>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-dark-muted font-bold uppercase block">Match Score</span>
                        <span className="inline-block mt-0.5 text-xs font-extrabold text-accent-teal bg-accent-teal/10 px-2 py-0.5 rounded">
                          {(result.score * 100).toFixed(1)}% Match
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-dark-bg/60 border border-dark-border/40 text-xs font-mono text-dark-text whitespace-pre-wrap leading-relaxed">
                      {result.chunkText}
                    </div>

                    <div className="mt-3 text-[10px] text-dark-muted flex items-center gap-4">
                      <span>Index Block #{idx + 1}</span>
                      <span>Page: {result.pageNumber}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Extracted Text Preview Drawer Modal (Pure White Light Theme) */}
      {previewDoc && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-end bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div 
            style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
            className="w-full max-w-2xl h-screen border-l border-slate-200 p-6 shadow-2xl flex flex-col justify-between overflow-hidden font-sans"
          >
            <div style={{ backgroundColor: '#ffffff' }} className="flex flex-col h-full overflow-hidden">
              {/* Header */}
              <div style={{ backgroundColor: '#ffffff' }} className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
                <div className="min-w-0 pr-4">
                  <span className="text-[11px] uppercase font-extrabold text-sky-600 tracking-wider block">
                    Ingested Document Text Extraction
                  </span>
                  <h3 style={{ color: '#0f172a' }} className="text-base font-extrabold truncate max-w-md mt-0.5">
                    {previewDoc.title}
                  </h3>
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  style={{ backgroundColor: '#f1f5f9', color: '#334155' }}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-200 transition-all cursor-pointer shrink-0 shadow-xs"
                >
                  <X className="w-5 h-5 text-slate-700" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div style={{ backgroundColor: '#ffffff' }} className="flex-1 overflow-y-auto py-5 space-y-4 pr-1 my-2">
                {/* Pure White Text Box with High Contrast Dark Text */}
                <div 
                  style={{ backgroundColor: '#f8fafc', color: '#020617', borderColor: '#cbd5e1' }}
                  className="p-5 rounded-xl border text-xs leading-relaxed font-mono whitespace-pre-wrap font-bold shadow-xs min-h-[250px] overflow-x-auto select-text"
                >
                  {previewDoc.extractedText || 'No text extracted.'}
                </div>

                <div 
                  style={{ backgroundColor: '#f0f9ff', borderColor: '#bae6fd', color: '#0369a1' }}
                  className="p-4 rounded-xl border text-xs space-y-2"
                >
                  <span className="font-extrabold block mb-1 text-xs uppercase tracking-wider text-sky-800">
                    Vector Catalog & Metadata
                  </span>
                  <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                    <p><span className="text-slate-500 font-medium">Status:</span> <span className="text-sky-700 font-extrabold">Active & Ready</span></p>
                    <p><span className="text-slate-500 font-medium">Ingested by:</span> <span className="text-slate-900 font-mono font-bold">{previewDoc.uploadedBy}</span></p>
                    <p><span className="text-slate-500 font-medium">Timestamp:</span> <span className="text-slate-900 font-bold">{new Date(previewDoc.createdAt).toLocaleString()}</span></p>
                    <p><span className="text-slate-500 font-medium">Length:</span> <span className="text-slate-900 font-extrabold">{previewDoc.extractedText?.length || 0} characters</span></p>
                  </div>
                </div>
              </div>

              {/* Footer Button */}
              <div style={{ backgroundColor: '#ffffff' }} className="pt-4 border-t border-slate-200 shrink-0">
                <button
                  onClick={() => setPreviewDoc(null)}
                  style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                  className="w-full py-2.5 rounded-xl hover:opacity-90 text-xs font-extrabold transition-all text-center cursor-pointer shadow-sm"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Document Confirmation Modal */}
      {deletingDoc && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn font-sans">
          <div className="w-full max-w-md bg-dark-card border border-dark-border rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                <Trash2 className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">Delete Document</h3>
                <p className="text-xs text-dark-muted mt-0.5">This action cannot be undone</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-dark-bg/80 border border-dark-border space-y-2 text-xs">
              <p className="text-white font-medium">
                Are you sure you want to delete <span className="font-bold text-rose-400 font-mono">"{deletingDoc.title}"</span>?
              </p>
              <p className="text-dark-muted text-[11px] leading-relaxed">
                All extracted text and search index blocks associated with this document will be permanently purged.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-dark-border">
              <button
                type="button"
                onClick={() => setDeletingDoc(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-dark-border bg-dark-bg hover:bg-dark-border/40 text-dark-muted hover:text-white transition-all text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-500/20"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 text-white" />
                    <span>Delete Document</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DocumentsPage;
