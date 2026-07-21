import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import {
  ArrowLeft,
  Calendar,
  Search,
  RotateCw,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  targetId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export const formatActionName = (action: string): string => {
  const map: Record<string, string> = {
    UPLOAD_DOCUMENT: 'Document Uploaded',
    DELETE_DOCUMENT: 'Document Deleted',
    LOGIN: 'User Logged In',
    LOGOUT: 'User Logged Out',
    ADD_MEMBER: 'Workspace Member Added',
    UPDATE_MEMBER: 'Workspace Member Updated',
    DELETE_MEMBER: 'Workspace Member Removed',
    UPDATE_ORGANIZATION: 'Workspace Settings Updated',
    ASK_COPILOT: 'Copilot Query Executed',
    SEARCH: 'Semantic Search Executed',
    ADD_ASSET: 'Equipment Asset Added'
  };
  if (map[action]) return map[action];
  return action
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const AuditLogPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [period, setPeriod] = useState<'today' | '7days' | '30days' | 'all' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch('/activity');
      setLogs(data.logs || []);
    } catch (err: any) {
      console.error('Failed to fetch activity logs:', err);
      setError(err.message || 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter logs based on date period, search, and action type
  const filteredLogs = logs.filter(log => {
    const logTime = new Date(log.timestamp).getTime();
    const now = new Date().getTime();

    if (period === 'today') {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      if (logTime < startOfToday.getTime()) return false;
    } else if (period === '7days') {
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      if (logTime < sevenDaysAgo) return false;
    } else if (period === '30days') {
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      if (logTime < thirtyDaysAgo) return false;
    } else if (period === 'custom') {
      if (startDate) {
        const start = new Date(startDate).getTime();
        if (logTime < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (logTime > end.getTime()) return false;
      }
    }

    if (actionFilter !== 'ALL' && log.action !== actionFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const friendlyAction = formatActionName(log.action).toLowerCase();
      const userId = (log.userId || '').toLowerCase();
      const metadataStr = JSON.stringify(log.metadata || {}).toLowerCase();
      
      const matches =
        friendlyAction.includes(q) ||
        log.action.toLowerCase().includes(q) ||
        userId.includes(q) ||
        metadataStr.includes(q);

      if (!matches) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatMetadata = (log: ActivityLog) => {
    if (!log.metadata) return '—';
    if (typeof log.metadata === 'string') return log.metadata;
    if (log.metadata.title) return `Document: ${log.metadata.title}`;
    if (log.metadata.email) return `User: ${log.metadata.email}`;
    if (log.metadata.assetName) return `Asset: ${log.metadata.assetName} (${log.metadata.equipmentTag || ''})`;
    if (log.metadata.name) return `Name: ${log.metadata.name}`;

    // Format metadata key-values cleanly instead of raw JSON
    const entries = Object.entries(log.metadata)
      .filter(([k]) => k !== 'hasApiKey' && k !== 'userName')
      .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${v}`);

    if (entries.length > 0) return entries.join(' · ');
    return '—';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-border pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl border border-dark-border bg-dark-card hover:bg-dark-border/40 text-dark-muted hover:text-dark-text transition-all cursor-pointer shadow-xs"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-dark-text font-sans tracking-tight">
              Workspace Audit Logs
            </h1>
            <p className="text-xs text-dark-muted mt-0.5">
              Complete security and operational activity timeline
            </p>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl border border-dark-border bg-dark-card hover:border-accent-teal/50 text-dark-muted hover:text-dark-text transition-all flex items-center gap-2 cursor-pointer text-xs font-bold shadow-xs"
        >
          <RotateCw className={`w-3.5 h-3.5 text-accent-teal ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter Bar & Controls */}
      <div className="glassmorphism p-5 rounded-xl space-y-4 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Time Period Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-dark-bg/60 rounded-xl border border-dark-border/60">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: '7days', label: 'Last 7 Days' },
              { id: '30days', label: 'Last 30 Days' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setPeriod(tab.id as any); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  period === tab.id
                    ? 'bg-accent-teal text-white shadow-xs'
                    : 'text-dark-muted hover:text-dark-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <button
              onClick={() => { setPeriod('custom'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                period === 'custom'
                  ? 'bg-accent-teal text-white shadow-xs'
                  : 'text-dark-muted hover:text-dark-text'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Custom Range</span>
            </button>
          </div>

          {/* Search Input & Action Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-dark-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search action or user..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-dark-bg border border-dark-border text-xs text-dark-text placeholder:text-dark-muted focus:outline-none focus:ring-1 focus:ring-accent-teal transition-all"
              />
            </div>

            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}
              className="w-full sm:w-auto px-3 py-2 rounded-xl bg-dark-bg border border-dark-border text-xs text-dark-text focus:outline-none focus:ring-1 focus:ring-accent-teal cursor-pointer font-semibold"
            >
              <option value="ALL">All Event Types</option>
              <option value="UPLOAD_DOCUMENT">Document Uploaded</option>
              <option value="DELETE_DOCUMENT">Document Deleted</option>
              <option value="LOGIN">User Logged In</option>
              <option value="ADD_MEMBER">Member Added</option>
              <option value="UPDATE_ORGANIZATION">Settings Updated</option>
              <option value="ASK_COPILOT">Copilot Query</option>
            </select>
          </div>
        </div>

        {/* Custom Date Pickers */}
        {period === 'custom' && (
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-dark-border/40 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-dark-muted">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                className="px-3 py-1.5 rounded-lg bg-dark-bg border border-dark-border text-xs text-dark-text focus:outline-none focus:ring-1 focus:ring-accent-teal"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-dark-muted">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                className="px-3 py-1.5 rounded-lg bg-dark-bg border border-dark-border text-xs text-dark-text focus:outline-none focus:ring-1 focus:ring-accent-teal"
              />
            </div>
          </div>
        )}
      </div>

      {/* Sleek Log Entries Table */}
      <div className="glassmorphism rounded-xl overflow-hidden shadow-md border border-dark-border">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-dark-muted">
            <Loader2 className="w-8 h-8 animate-spin text-accent-teal mb-3" />
            <p className="text-xs font-bold text-dark-text">Retrieving audit activity logs...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-accent-rose text-xs font-bold">
            {error}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-dark-muted space-y-1">
            <p className="text-xs font-bold text-dark-text">No audit records found matching selected filter.</p>
            <p className="text-[11px]">Try adjusting your search terms or date filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-dark-border bg-dark-bg/60 text-dark-muted font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 pl-6">Action / Event</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Triggered By</th>
                  <th className="py-3.5 pr-6 text-right">Target Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40 font-sans">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-dark-border/15 transition-all">
                    <td className="py-3.5 pl-6">
                      <span className="font-bold text-dark-text text-xs">
                        {formatActionName(log.action)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-dark-muted font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      {/* Clean High-Contrast Text without Cylinder Pill */}
                      <span className="font-mono text-xs font-bold text-dark-text">
                        {log.userId}
                      </span>
                    </td>
                    <td className="py-3.5 pr-6 text-right text-dark-muted font-medium text-xs max-w-xs truncate">
                      {formatMetadata(log)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-dark-border bg-dark-bg/30">
            <p className="text-xs text-dark-muted">
              Showing <span className="text-dark-text font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="text-dark-text font-bold">{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</span> of{' '}
              <span className="text-dark-text font-bold">{filteredLogs.length}</span> records
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-dark-border bg-dark-card text-dark-muted hover:text-dark-text disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-dark-text px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-dark-border bg-dark-card text-dark-muted hover:text-dark-text disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogPage;
