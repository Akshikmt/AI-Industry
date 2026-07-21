import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import {
  AlertTriangle,
  Sparkles,
  Loader2,
  Cpu,
  BookOpen,
  Eye,
  BellRing,
  HelpCircle
} from 'lucide-react';

interface Anomaly {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  assetTag: string;
  assetName: string;
  title: string;
  description: string;
  timestamp: string;
}

interface Recommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  assetTag: string;
  assetName: string;
  title: string;
  action: string;
  rationale: string;
  documentLink: string;
  documentTitle: string;
}

interface Asset {
  id: string;
  equipmentTag: string;
}

const InsightsPage: React.FC = () => {
  const navigate = useNavigate();

  // Data States
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [summary, setSummary] = useState({ totalAnomalies: 0, critical: 0, warning: 0, info: 0 });
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInsightsData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch insights
      const insightsData = await apiFetch('/insights');
      setAnomalies(insightsData.anomalies);
      setRecommendations(insightsData.recommendations);
      setSummary(insightsData.summary);

      // 2. Fetch assets catalog to resolve tag -> ID links
      const assetsData = await apiFetch('/assets');
      setAssets(assetsData.assets);
    } catch (err: any) {
      setError(err.message || 'Failed to load operational insights.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsightsData();
  }, []);

  // Helper to map asset tag to ID for routing
  const navigateToAsset = (tag: string) => {
    const asset = assets.find(a => a.equipmentTag.toLowerCase() === tag.toLowerCase());
    if (asset) {
      navigate(`/dashboard/assets/${asset.id}`);
    } else {
      // Catalog fallback
      navigate('/dashboard/assets');
    }
  };

  // Severity color maps
  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-accent-rose/10 text-accent-rose border border-accent-rose/25';
      case 'warning': return 'bg-accent-amber/10 text-accent-amber border border-accent-amber/25';
      default: return 'bg-accent-blue/10 text-accent-blue border border-accent-blue/25';
    }
  };

  const getPriorityColorClass = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-accent-rose/5 text-accent-rose border border-accent-rose/20';
      case 'medium': return 'bg-accent-amber/5 text-accent-amber border border-accent-amber/20';
      default: return 'bg-accent-teal/5 text-accent-teal border border-accent-teal/20';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-dark-muted">
        <Loader2 className="w-8 h-8 animate-spin text-accent-teal" />
        <p className="text-xs mt-2 font-semibold animate-pulse font-sans">Querying operational audit history & anomaly indicators...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-xs text-accent-rose flex items-center justify-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-[1.5rem] font-extrabold text-white font-sans">
            Operations Control Room
          </h1>
          <p className="text-xs text-dark-muted mt-1">
            Proactive maintenance analysis and anomaly alarm logging
          </p>
        </div>

        <button
          onClick={loadInsightsData}
          className="text-xs font-bold text-accent-teal hover:underline flex items-center gap-1"
        >
          <BellRing className="w-3.5 h-3.5" />
          Poll Alarms
        </button>
      </div>

      {/* Metrics Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

        {/* Total Anomalies */}
        <div className="glassmorphism p-5 rounded-xl border-l-4 border-l-accent-teal">
          <span className="text-[10px] text-dark-muted font-bold uppercase block tracking-wider">Total Active Alarms</span>
          <span className="text-2xl font-extrabold text-white font-mono mt-1 block">{summary.totalAnomalies}</span>
        </div>

        {/* Critical */}
        <div className={`glassmorphism p-5 rounded-xl border-l-4 border-l-accent-rose ${summary.critical > 0 ? 'shadow-glow-rose' : ''}`}>
          <span className="text-[10px] text-dark-muted font-bold uppercase block tracking-wider">Critical Failures</span>
          <span className="text-2xl font-extrabold text-white font-mono mt-1 block">{summary.critical}</span>
        </div>

        {/* Warning */}
        <div className="glassmorphism p-5 rounded-xl border-l-4 border-l-accent-amber">
          <span className="text-[10px] text-dark-muted font-bold uppercase block tracking-wider">Warnings Active</span>
          <span className="text-2xl font-extrabold text-white font-mono mt-1 block">{summary.warning}</span>
        </div>

        {/* Info */}
        <div className="glassmorphism p-5 rounded-xl border-l-4 border-l-accent-blue">
          <span className="text-[10px] text-dark-muted font-bold uppercase block tracking-wider">Routine Overdue</span>
          <span className="text-2xl font-extrabold text-white font-mono mt-1 block">{summary.info}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left Column - Live Anomaly Alarm Feed */}
        <div className="lg:col-span-3 space-y-5">
          <h3 className="font-extrabold text-sm text-white font-sans flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-accent-rose" />
            Live Anomaly Feed
          </h3>

          {anomalies.length === 0 ? (
            <div className="glassmorphism p-8 text-center text-xs text-dark-muted rounded-xl">
              No anomalies registered on the active plant grid.
            </div>
          ) : (
            <div className="space-y-4">
              {anomalies.map((anom) => (
                <div key={anom.id} className="glassmorphism p-5 rounded-xl relative overflow-hidden group hover:border-dark-border transition-all">

                  {/* Left indicator bar */}
                  <div className={`absolute top-0 left-0 w-1 h-full ${anom.severity === 'critical'
                    ? 'bg-accent-rose'
                    : anom.severity === 'warning'
                      ? 'bg-accent-amber'
                      : 'bg-accent-blue'
                    }`}></div>

                  <div className="flex justify-between items-start mb-3.5 pl-2">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-dark-muted font-mono flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-accent-teal" />
                        {anom.assetName} ({anom.assetTag})
                      </span>
                      <h4 className="text-xs font-extrabold text-white mt-1">{anom.title}</h4>
                    </div>

                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${getSeverityBadgeClass(anom.severity)}`}>
                        {anom.severity}
                      </span>
                      <span className="text-[9px] text-dark-muted font-mono block mt-1">
                        {new Date(anom.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-dark-muted leading-relaxed pl-2 mb-4">
                    {anom.description}
                  </p>

                  <div className="pl-2 pt-3 border-t border-dark-border/40 flex justify-between items-center text-xs">
                    <button
                      onClick={() => navigateToAsset(anom.assetTag)}
                      className="text-accent-teal hover:underline font-bold flex items-center gap-1 text-[11px]"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Inspect Equipment
                    </button>
                    <button
                      onClick={() => navigate('/dashboard/copilot')}
                      className="text-dark-muted hover:text-white flex items-center gap-1 text-[11px] font-bold"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      Ask AI Copilot
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - AI Proactive Recommendations */}
        <div className="lg:col-span-2 space-y-5">
          <h3 className="font-extrabold text-sm text-white font-sans flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-teal" />
            AI Proactive Recommendations
          </h3>

          {recommendations.length === 0 ? (
            <div className="glassmorphism p-8 text-center text-xs text-dark-muted rounded-xl">
              Ingest maintenance schedules to compile AI recommendations.
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className="glassmorphism p-5 rounded-xl border border-dark-border/60 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] text-accent-teal font-extrabold uppercase font-mono">{rec.assetTag} Recommendation</span>
                      <h4 className="text-xs font-extrabold text-white mt-0.5">{rec.title}</h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${getPriorityColorClass(rec.priority)}`}>
                      {rec.priority}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-[9px] text-dark-muted font-bold uppercase block">Action:</span>
                      <p className="text-white font-sans font-semibold mt-0.5">{rec.action}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-dark-bg/50 border border-dark-border/40">
                      <span className="text-[9px] text-dark-muted font-bold uppercase block">AI Rationale:</span>
                      <p className="text-dark-muted leading-relaxed mt-0.5 text-[11px]">{rec.rationale}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-dark-border/40 flex justify-between items-center text-xs">
                    {rec.documentLink && rec.documentLink !== '#' ? (
                      <a
                        href={rec.documentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-teal hover:underline flex items-center gap-1 text-[11px] font-bold"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Source SOP Manual
                      </a>
                    ) : (
                      <span className="text-dark-muted text-[10px]">No linked manual</span>
                    )}

                    <button
                      onClick={() => navigateToAsset(rec.assetTag)}
                      className="text-dark-muted hover:text-white text-[11px] font-bold"
                    >
                      Open Specs
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default InsightsPage;
