import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { 
  FileText, 
  Cpu, 
  Users, 
  Activity, 
  UploadCloud, 
  Search, 
  MessageSquare, 
  ArrowRight,
  TrendingUp,
  History,
  Loader2,
  RotateCw
} from 'lucide-react';

import { formatActionName } from './AuditLogPage';

interface ActivityItem {
  id: string;
  action: string;
  timestamp: string;
  userId: string; // Shows email or ID
  metadata?: Record<string, any>;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Custom states
  const [stats, setStats] = useState({
    documents: 0,
    assets: 0,
    users: 1,
    health: 100,
    failedDocs: 0,
    queries: 0,
    uploadedToday: 0
  });
  
  const [recentLogs, setRecentLogs] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [allActivityLogs, setAllActivityLogs] = useState<ActivityItem[]>([]);
  const [chartView, setChartView] = useState<'weekly' | 'monthly'>('weekly');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch assets list to get count
      const assetsData = await apiFetch('/assets');
      
      // Fetch documents list to get count
      const docsData = await apiFetch('/documents');
      
      // Fetch audit logs
      const logsData = await apiFetch('/activity');
      const nonLoginLogs = logsData.logs.filter((log: ActivityItem) => log.action !== 'LOGIN');
      
      // Count total Copilot queries for this tenant
      const queriesCount = logsData.logs.filter((log: ActivityItem) => log.action === 'ASK_COPILOT').length;
      
      // Calculate ingestion success rate and today's uploads
      const allDocs = docsData.documents || [];
      const failedDocs = allDocs.filter((d: any) => d.status === 'failed');
      const successRate = allDocs.length > 0
        ? Math.round(((allDocs.length - failedDocs.length) / allDocs.length) * 100)
        : 0;

      const todayStr = new Date().toISOString().split('T')[0];
      const uploadedTodayCount = allDocs.filter((d: any) => {
        if (!d.createdAt) return false;
        return new Date(d.createdAt).toISOString().split('T')[0] === todayStr;
      }).length;
      
      // Fetch organization members if user is Admin
      let totalStaff = 1;
      if (user?.role === 'admin') {
        try {
          const membersData = await apiFetch('/auth/members');
          totalStaff = membersData.members?.length || 1;
        } catch (err) {
          console.error('Failed to fetch workspace members:', err);
        }
      }
      
      setStats({
        documents: allDocs.length,
        assets: assetsData.assets?.length || 0,
        users: totalStaff,
        health: successRate,
        failedDocs: failedDocs.length,
        queries: queriesCount,
        uploadedToday: uploadedTodayCount
      });
      setAllActivityLogs(nonLoginLogs);
      setRecentLogs(nonLoginLogs.slice(0, 10)); // Display up to 10 logs
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Check if first time loading dashboard for this user
    if (user) {
      const key = `samiq_visited_${user.id}`;
      const visited = localStorage.getItem(key);
      if (!visited) {
        setIsFirstTime(true);
        localStorage.setItem(key, 'true');
      }
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div 
        className="relative overflow-hidden rounded-2xl border border-dark-border p-8 shadow-xl bg-cover bg-center"
        style={{
          backgroundImage: `url('/welcome-bg.jpg')`
        }}
      >
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-accent-teal/5 rounded-full filter blur-[80px] pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white font-sans">
              {isFirstTime ? 'Welcome to SamiQ, ' : 'Welcome back, '}<span className="bg-gradient-to-r from-accent-teal to-accent-blue bg-clip-text text-transparent glow-text-teal">{user.name}</span>
            </h2>
            <p className="text-sm text-dark-muted mt-2 max-w-xl leading-relaxed">
              {isFirstTime || stats.documents === 0
                ? 'Your workspace is active. Start by uploading technical documents or manuals to build your search index.'
                : 'Operations are active. All ingested documentation is fully indexed and ready for search.'
              }
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/dashboard/copilot')}
              className="px-5 py-3 rounded-lg bg-gradient-to-r from-accent-teal to-accent-blue hover:from-accent-tealHover hover:to-accent-blue text-[#ffffff] text-sm font-bold shadow-glow-teal flex items-center gap-2 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-[#ffffff]" />
              Ask Copilot
              <ArrowRight className="w-4 h-4 text-[#ffffff]" />
            </button>
          </div>
        </div>
      </div>

      {user.role === 'admin' ? (
        /* ==================== ADMIN VIEW ==================== */
        <div className="space-y-8">
          {/* Metrics Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Documents Card */}
            <div className="glassmorphism stat-card-hover p-6 rounded-xl border-l-4 border-l-accent-teal relative overflow-hidden group transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-accent-teal/5 rounded-full filter blur-xl pointer-events-none"></div>
              <div className="flex justify-between items-center relative z-10">
                <div>
                  <p className="text-[11px] font-bold text-accent-teal uppercase tracking-wider">Ingested Documents</p>
                  <p className="text-3xl font-extrabold text-white mt-2 font-sans">{stats.documents}</p>
                  <div className="mt-4 flex items-center gap-1.5 text-[11px] text-dark-muted">
                    <TrendingUp className="w-3.5 h-3.5 text-accent-teal" />
                    <span>+{stats.uploadedToday} Uploaded today</span>
                  </div>
                </div>
                <div className="w-1.5 h-16 rounded-full bg-accent-teal opacity-60 shrink-0"></div>
              </div>
            </div>

            {/* Assets Card */}
            <div className="glassmorphism stat-card-hover p-6 rounded-xl border-l-4 border-l-accent-teal relative overflow-hidden group transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-accent-teal/5 rounded-full filter blur-xl pointer-events-none"></div>
              <div className="flex justify-between items-center relative z-10">
                <div>
                  <p className="text-[11px] font-bold text-accent-teal uppercase tracking-wider">Monitored Assets</p>
                  <p className="text-3xl font-extrabold text-white mt-2 font-sans">{stats.assets}</p>
                  <div className="mt-4 text-[11px] text-dark-muted">
                    <span>Tag prefixes: P, T, C, E, V</span>
                  </div>
                </div>
                <div className="w-1.5 h-16 rounded-full bg-accent-teal opacity-60 shrink-0"></div>
              </div>
            </div>

            {/* Users Card */}
            <div className="glassmorphism stat-card-hover p-6 rounded-xl border-l-4 border-l-accent-teal relative overflow-hidden group transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-accent-teal/5 rounded-full filter blur-xl pointer-events-none"></div>
              <div className="flex justify-between items-center relative z-10">
                <div>
                  <p className="text-[11px] font-bold text-accent-teal uppercase tracking-wider">Active Staff</p>
                  <p className="text-3xl font-extrabold text-white mt-2 font-sans">{stats.users}</p>
                  <div className="mt-4 text-[11px] text-dark-muted">
                    <span>Authorized workspace members</span>
                  </div>
                </div>
                <div className="w-1.5 h-16 rounded-full bg-accent-teal opacity-60 shrink-0"></div>
              </div>
            </div>

            {/* Health Card */}
            <div className="glassmorphism stat-card-hover p-6 rounded-xl border-l-4 border-l-accent-teal relative overflow-hidden group transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-accent-teal/5 rounded-full filter blur-xl pointer-events-none"></div>
              <div className="flex justify-between items-center relative z-10">
                <div>
                  <p className="text-[11px] font-bold text-accent-teal uppercase tracking-wider">Ingestion Success</p>
                  <p className="text-3xl font-extrabold text-white mt-2 font-sans">{stats.health}%</p>
                  <div className="mt-4 text-[11px] text-dark-muted">
                    <span>{stats.failedDocs} failed extraction{stats.failedDocs !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="w-1.5 h-16 rounded-full bg-accent-teal opacity-60 shrink-0"></div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Ingestion Charts/Activity */}
            <div className="glassmorphism p-6 rounded-xl lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-base text-white font-sans">Ingestion Volume Over Time</h3>
                  <p className="text-[10px] text-dark-muted mt-0.5">
                    {chartView === 'weekly' ? 'Daily metrics for the last 7 days' : 'Daily metrics for the last 30 days'}
                  </p>
                </div>
                
                {/* View Switcher Toggle */}
                <div className="flex bg-dark-bg p-1 rounded-lg border border-dark-border shadow-inner shrink-0">
                  <button
                    onClick={() => setChartView('weekly')}
                    className={`px-3 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                      chartView === 'weekly'
                        ? 'bg-accent-teal text-[#ffffff] shadow-sm'
                        : 'text-dark-muted hover:text-white'
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setChartView('monthly')}
                    className={`px-3 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                      chartView === 'monthly'
                        ? 'bg-accent-teal text-[#ffffff] shadow-sm'
                        : 'text-dark-muted hover:text-white'
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              {/* Premium HTML/CSS Bar Chart Dynamic */}
              <div key={chartView} className="h-44 flex items-end justify-between gap-1.5 pt-4 border-b border-dark-border px-2">
                {(() => {
                  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  const limit = chartView === 'weekly' ? 7 : 30;
                  const weeklyData = [];
                  
                  // Compute target days dynamically
                  for (let i = limit - 1; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    const dayName = daysOfWeek[date.getDay()];
                    
                    const start = new Date(date);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(date);
                    end.setHours(23, 59, 59, 999);
                    
                    const count = allActivityLogs.filter(log => {
                      if (log.action !== 'UPLOAD_DOCUMENT') return false;
                      const logTime = new Date(log.timestamp).getTime();
                      return logTime >= start.getTime() && logTime <= end.getTime();
                    }).length;
                    
                    weeklyData.push({ day: dayName, count, date });
                  }
                  
                  const maxCount = Math.max(...weeklyData.map(d => d.count), 1);
                  
                  return weeklyData.map((item, idx) => {
                    const dateStr = item.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                    // Determine if we show a label under this bar
                    const showLabel = chartView === 'weekly' || idx === 0 || idx === limit - 1 || (limit - 1 - idx) % 5 === 0;
                    
                    const labelText = chartView === 'weekly'
                      ? item.day
                      : (idx === 0 || idx === limit - 1)
                        ? `${item.date.getDate()} ${item.date.toLocaleString('default', { month: 'short' })}`
                        : `${item.date.getDate()}`;

                    return (
                      <div key={idx} className="flex-1 h-36 flex flex-col justify-end items-center gap-2 group min-w-0">
                        <div className="w-full flex-1 flex items-end justify-center">
                          <div 
                            style={{ height: `${(item.count / maxCount) * 100}%` }} 
                            className={`w-full rounded-t transition-all duration-300 group-hover:brightness-110 min-h-[4px] animate-bar-grow ${
                              item.count > 0 
                                ? 'bg-gradient-to-t from-accent-teal to-accent-blue shadow-glow-teal' 
                                : 'bg-dark-border hover:bg-accent-teal/60'
                            }`}
                            title={`${item.count} documents ingested on ${dateStr}`}
                          ></div>
                        </div>
                        <span 
                          className={`text-[9px] text-dark-muted font-bold uppercase transition-all duration-300 ${
                            showLabel ? 'opacity-100' : 'opacity-0 h-0 w-0 overflow-hidden pointer-events-none'
                          }`}
                        >
                          {labelText}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="glassmorphism p-6 rounded-xl space-y-6">
              <h3 className="font-extrabold text-base text-white font-sans">Quick Administration</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/dashboard/documents')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-dark-border bg-dark-bg hover:border-accent-teal/50 hover:bg-accent-teal/5 transition-all text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-md bg-accent-teal/10 flex items-center justify-center text-accent-teal">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Upload New Document</p>
                    <p className="text-[10px] text-dark-muted mt-0.5">PDF, DOCX, Images</p>
                  </div>
                </button>
                <button 
                  onClick={() => navigate('/dashboard/assets')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-dark-border bg-dark-bg hover:border-accent-teal/50 hover:bg-accent-teal/5 transition-all text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-md bg-accent-teal/10 flex items-center justify-center text-accent-teal">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Manage Equipment Assets</p>
                    <p className="text-[10px] text-dark-muted mt-0.5">Update tags and metadata</p>
                  </div>
                </button>
                <button 
                  onClick={() => navigate('/dashboard/insights')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-dark-border bg-dark-bg hover:border-accent-teal/50 hover:bg-accent-teal/5 transition-all text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-md bg-accent-teal/10 flex items-center justify-center text-accent-teal">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">View AI Insights</p>
                    <p className="text-[10px] text-dark-muted mt-0.5">Check operations analytics and trends</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Activity Logs section */}
          <div className="glassmorphism p-6 rounded-xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-accent-teal" />
                <h3 className="font-extrabold text-base text-white font-sans">Recent Activity Audit Log</h3>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={fetchDashboardData}
                  disabled={loading}
                  className="p-1.5 rounded-lg border border-dark-border bg-dark-bg/80 text-dark-muted hover:text-white hover:border-accent-teal transition-all cursor-pointer flex items-center justify-center shadow-sm"
                  title="Refresh Audit Log"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => navigate('/dashboard/audit-logs')}
                  className="px-3 py-1.5 rounded-lg border border-accent-teal/30 bg-accent-teal/10 hover:bg-accent-teal/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-glow-teal"
                >
                  <span>View All Logs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-6 text-dark-muted">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span>Loading activities...</span>
              </div>
            ) : recentLogs.length === 0 ? (
              <div className="py-6 text-center text-xs text-dark-muted">
                No activity records found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-dark-border text-dark-muted font-bold uppercase tracking-wider">
                      <th className="pb-3 pl-4">Action</th>
                      <th className="pb-3">Timestamp</th>
                      <th className="pb-3">Triggered By</th>
                      <th className="pb-3 pr-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border/40">
                    {recentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-dark-border/20 transition-all">
                        <td className="py-3 pl-4 font-bold text-xs text-accent-teal">
                          {formatActionName(log.action)}
                        </td>
                        <td className="py-3 text-dark-muted font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="py-3 text-white font-semibold">{log.userId}</td>
                        <td className="py-3 pr-4 text-right text-dark-muted">
                          {log.action === 'LOGIN' ? `Role: ${log.metadata?.role || 'user'}` : 'Success'}
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
        /* ==================== EMPLOYEE VIEW ==================== */
        <div className="space-y-8">
          {/* Employee Metrics Grid */}
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="glassmorphism stat-card-hover p-6 rounded-xl border-l-4 border-l-accent-teal relative overflow-hidden transition-all">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-accent-teal/5 rounded-full filter blur-xl pointer-events-none"></div>
              <div className="flex justify-between items-center relative z-10">
                <div>
                  <p className="text-[11px] font-bold text-accent-teal uppercase tracking-wider">Active Assets catalog</p>
                  <p className="text-2xl font-extrabold text-white mt-1 font-sans">{stats.assets}</p>
                </div>
                <div className="w-1.5 h-12 rounded-full bg-accent-teal opacity-60 shrink-0"></div>
              </div>
            </div>

            <div className="glassmorphism stat-card-hover p-6 rounded-xl border-l-4 border-l-accent-teal relative overflow-hidden transition-all">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-accent-teal/5 rounded-full filter blur-xl pointer-events-none"></div>
              <div className="flex justify-between items-center relative z-10">
                <div>
                  <p className="text-[11px] font-bold text-accent-teal uppercase tracking-wider">Indexed Manuals & SOPs</p>
                  <p className="text-2xl font-extrabold text-white mt-1 font-sans">{stats.documents}</p>
                </div>
                <div className="w-1.5 h-12 rounded-full bg-accent-teal opacity-60 shrink-0"></div>
              </div>
            </div>

            <div className="glassmorphism stat-card-hover p-6 rounded-xl border-l-4 border-l-accent-teal relative overflow-hidden transition-all">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-accent-teal/5 rounded-full filter blur-xl pointer-events-none"></div>
              <div className="flex justify-between items-center relative z-10">
                <div>
                  <p className="text-[11px] font-bold text-accent-teal uppercase tracking-wider">Copilot Queries Run</p>
                  <p className="text-2xl font-extrabold text-white mt-1 font-sans">{stats.queries}</p>
                </div>
                <div className="w-1.5 h-12 rounded-full bg-accent-teal opacity-60 shrink-0"></div>
              </div>
            </div>
          </div>

          {/* Quick Search Shortcut */}
          <div className="glassmorphism p-6 rounded-xl space-y-4">
            <h3 className="font-extrabold text-base text-white font-sans">Ask SamiQ</h3>
            <div 
              onClick={() => navigate('/dashboard/copilot')}
              className="relative cursor-pointer group"
            >
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-dark-muted group-hover:text-accent-blue transition-colors">
                <Search className="w-5 h-5" />
              </div>
              <div className="w-full pl-12 pr-4 py-4 rounded-xl border border-dark-border bg-dark-bg text-sm text-dark-muted flex justify-between items-center transition-all group-hover:border-accent-blue/50">
                <span>Ask AI: "Why did Centrifugal Water Pump P-101 fail?"</span>
                <span className="text-xs px-2.5 py-1 rounded bg-dark-card border border-dark-border group-hover:border-accent-blue/30 text-white font-semibold flex items-center gap-1.5 transition-colors">
                  Consult Copilot
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* Featured Assets Catalog */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-white font-sans">Frequently Consulted Assets</h3>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { tag: 'P-101', name: 'Centrifugal Water Pump', dept: 'Operations' },
                { tag: 'T-202', name: 'Steam Turbine', dept: 'Maintenance' },
                { tag: 'C-303', name: 'Air Compressor', dept: 'Safety' }
              ].map((asset, idx) => (
                <div 
                  key={idx}
                  onClick={() => navigate('/dashboard/assets')}
                  className="glassmorphism p-5 rounded-xl cursor-pointer border border-dark-border"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2 py-0.5 rounded bg-accent-teal/10 text-accent-teal text-[10px] font-bold tracking-wider font-mono">
                      {asset.tag}
                    </span>
                    <span className="text-[10px] text-dark-muted font-semibold uppercase">{asset.dept}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white font-sans line-clamp-1">{asset.name}</h4>
                  <p className="text-[11px] text-dark-muted mt-1 leading-normal">
                    Click to review inspection timeline, logs, and manuals.
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick AI Suggestions */}
          <div className="glassmorphism p-6 rounded-xl space-y-4">
            <h3 className="font-extrabold text-base text-white font-sans">Suggested Prompts</h3>
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              {[
                'What is the standard operating temperature of T-202?',
                'Show safety inspection procedures for Valve V-505.',
                'List all active maintenance events for Pump P-101.',
                'Retrieve the incident reports for Compressor C-303.'
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate('/dashboard/copilot')}
                  className="p-3 text-left rounded-lg border border-dark-border bg-dark-bg/40 text-dark-muted hover:text-white hover:border-accent-blue/30 hover:bg-accent-blue/5 transition-all flex items-center justify-between"
                >
                  <span className="truncate">{prompt}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-accent-blue shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
