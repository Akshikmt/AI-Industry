import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../utils/api';
import {
  Building2,
  ShieldAlert,
  Loader2,
  Save,
  Lock,
  CheckCircle2,
  Bell,
  Sliders,
  Globe
} from 'lucide-react';

interface OrgData {
  name: string;
  industryType?: string;
  companySize?: string;
  addressLine1?: string;
  addressLine2?: string;
  zipCode?: string;
  country?: string;
  state?: string;
  city?: string;
}

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Organization settings states
  const [orgData, setOrgData] = useState<OrgData>({
    name: '',
    industryType: 'Manufacturing',
    companySize: '51–200',
    addressLine1: '',
    addressLine2: '',
    zipCode: '',
    country: '',
    state: '',
    city: ''
  });

  // Basic System & Notification preference states
  const [emailAlarms, setEmailAlarms] = useState<boolean>(() => localStorage.getItem('samiq_notify_alarms') !== 'false');
  const [emailSop, setEmailSop] = useState<boolean>(() => localStorage.getItem('samiq_notify_sop') !== 'false');
  const [refreshRate, setRefreshRate] = useState<string>(() => localStorage.getItem('samiq_refresh_rate') || '10');
  const [timezone, setTimezone] = useState<string>(() => localStorage.getItem('samiq_timezone') || 'IST');

  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        setError(null);
        if (user && user.role === 'admin') {
          const res = await apiFetch('/auth/organization');
          if (res && res.organization) {
            setOrgData({
              name: res.organization.name || '',
              industryType: res.organization.industryType || 'Manufacturing',
              companySize: res.organization.companySize || '51–200',
              addressLine1: res.organization.addressLine1 || '',
              addressLine2: res.organization.addressLine2 || '',
              zipCode: res.organization.zipCode || '',
              country: res.organization.country || '',
              state: res.organization.state || '',
              city: res.organization.city || ''
            });
          }
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to retrieve workspace organization details.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrg();
  }, [user]);

  const handleSaveAllSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      // Save local preferences
      localStorage.setItem('samiq_notify_alarms', String(emailAlarms));
      localStorage.setItem('samiq_notify_sop', String(emailSop));
      localStorage.setItem('samiq_refresh_rate', refreshRate);
      localStorage.setItem('samiq_timezone', timezone);

      // If admin, save Organization profile to backend
      if (user?.role === 'admin') {
        await apiFetch('/auth/organization', {
          method: 'PUT',
          body: JSON.stringify(orgData)
        });
      }

      setSuccess('Workspace settings saved successfully!');
      showToast('Workspace settings saved successfully!', 'success');
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings.');
      showToast(err.message || 'Failed to save settings.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-slide-in">
      {/* Header */}
      <div className="border-b border-dark-border pb-5">
        <h1 className="text-xl font-extrabold text-white font-sans tracking-tight">
          Workspace Settings
        </h1>
        <p className="text-dark-muted text-xs mt-1">
          Configure organizational profiles, notification preferences, and system timezones
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-dark-muted">
          <Loader2 className="w-8 h-8 text-accent-teal animate-spin" />
          <p className="text-xs font-bold text-white">Retrieving workspace configurations...</p>
        </div>
      ) : (
        <form onSubmit={handleSaveAllSettings} className="space-y-6">
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-accent-rose/30 bg-accent-rose/10 text-xs text-accent-rose">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span className="font-bold">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-bold">{success}</span>
            </div>
          )}

          {/* SECTION 1: ORGANIZATION PROFILE */}
          <div className="glassmorphism p-6 rounded-xl border border-dark-border space-y-5 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-dark-border">
              <Building2 className="w-5 h-5 text-accent-teal" />
              <div>
                <h2 className="text-sm font-extrabold text-white">Organization Profile</h2>
                <p className="text-[11px] text-dark-muted">Administrative organizational metadata and primary headquarters address</p>
              </div>
            </div>

            {user?.role !== 'admin' && (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-xs text-amber-400">
                <Lock className="w-4 h-4 shrink-0" />
                <span>Organization profile details are read-only for operator role accounts.</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-dark-muted uppercase tracking-wider">Company Name</label>
                  <input
                    type="text"
                    disabled={user?.role !== 'admin' || updating}
                    value={orgData.name}
                    onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-dark-bg border border-dark-border text-xs text-white disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-accent-teal"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-dark-muted uppercase tracking-wider">Industry Type</label>
                  <select
                    disabled={user?.role !== 'admin' || updating}
                    value={orgData.industryType}
                    onChange={(e) => setOrgData({ ...orgData, industryType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-dark-bg border border-dark-border text-xs text-white disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-accent-teal font-semibold"
                  >
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Oil & Gas">Oil & Gas</option>
                    <option value="Automotive">Automotive</option>
                    <option value="Pharmaceutical">Pharmaceutical</option>
                    <option value="Power & Energy">Power & Energy</option>
                    <option value="Mining">Mining</option>
                    <option value="Chemical">Chemical</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-dark-muted uppercase tracking-wider">Company Size</label>
                  <select
                    disabled={user?.role !== 'admin' || updating}
                    value={orgData.companySize}
                    onChange={(e) => setOrgData({ ...orgData, companySize: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-dark-bg border border-dark-border text-xs text-white disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-accent-teal font-semibold"
                  >
                    <option value="1–50">1–50 employees</option>
                    <option value="51–200">51–200 employees</option>
                    <option value="201–500">201–500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-dark-muted uppercase tracking-wider">ZIP Code</label>
                  <input
                    type="text"
                    disabled={user?.role !== 'admin' || updating}
                    value={orgData.zipCode}
                    onChange={(e) => setOrgData({ ...orgData, zipCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-dark-bg border border-dark-border text-xs text-white disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-accent-teal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-dark-muted uppercase tracking-wider">Address Line 1</label>
                  <input
                    type="text"
                    disabled={user?.role !== 'admin' || updating}
                    value={orgData.addressLine1}
                    onChange={(e) => setOrgData({ ...orgData, addressLine1: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-dark-bg border border-dark-border text-xs text-white disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-accent-teal"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-dark-muted uppercase tracking-wider">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    disabled={user?.role !== 'admin' || updating}
                    value={orgData.addressLine2}
                    onChange={(e) => setOrgData({ ...orgData, addressLine2: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-dark-bg border border-dark-border text-xs text-white disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-accent-teal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-dark-muted uppercase tracking-wider">Country</label>
                  <input
                    type="text"
                    disabled={user?.role !== 'admin' || updating}
                    value={orgData.country}
                    onChange={(e) => setOrgData({ ...orgData, country: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-dark-bg border border-dark-border text-xs text-white disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-accent-teal"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-dark-muted uppercase tracking-wider">State</label>
                  <input
                    type="text"
                    disabled={user?.role !== 'admin' || updating}
                    value={orgData.state}
                    onChange={(e) => setOrgData({ ...orgData, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-dark-bg border border-dark-border text-xs text-white disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-accent-teal"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-dark-muted uppercase tracking-wider">City</label>
                  <input
                    type="text"
                    disabled={user?.role !== 'admin' || updating}
                    value={orgData.city}
                    onChange={(e) => setOrgData({ ...orgData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-dark-bg border border-dark-border text-xs text-white disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-accent-teal"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: SYSTEM PREFERENCES */}
          <div className="glassmorphism p-6 rounded-xl border border-dark-border space-y-5 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-dark-border">
              <Sliders className="w-5 h-5 text-accent-blue" />
              <div>
                <h2 className="text-sm font-extrabold text-white">System & Regional Preferences</h2>
                <p className="text-[11px] text-dark-muted">Configure default timezone and telemetry update frequencies</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-dark-muted uppercase tracking-wider">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-dark-bg border border-dark-border text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent-teal font-semibold"
                >
                  <option value="IST">Asia/Kolkata (IST - UTC +5:30)</option>
                  <option value="UTC">Coordinated Universal Time (UTC)</option>
                  <option value="EST">US Eastern Time (EST)</option>
                  <option value="PST">US Pacific Time (PST)</option>
                  <option value="GMT">London (GMT)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-dark-muted uppercase tracking-wider">Telemetry Refresh Frequency</label>
                <select
                  value={refreshRate}
                  onChange={(e) => setRefreshRate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-dark-bg border border-dark-border text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent-teal font-semibold"
                >
                  <option value="5">Every 5 seconds (Real-time Streaming)</option>
                  <option value="10">Every 10 seconds (Standard)</option>
                  <option value="30">Every 30 seconds (Low Bandwidth)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3: NOTIFICATIONS */}
          <div className="glassmorphism p-6 rounded-xl border border-dark-border space-y-5 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-dark-border">
              <Bell className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="text-sm font-extrabold text-white">Notification Preferences</h2>
                <p className="text-[11px] text-dark-muted">Configure automated alerts for operational alarms and workspace updates</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-lg border border-dark-border bg-dark-bg/60 cursor-pointer select-none">
                <div>
                  <span className="text-xs font-bold text-white block">Critical Equipment Alarm Notifications</span>
                  <span className="text-[11px] text-dark-muted">Send immediate alerts when equipment telemetry breaches safety thresholds.</span>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlarms}
                  onChange={(e) => setEmailAlarms(e.target.checked)}
                  className="rounded border-dark-border text-accent-teal bg-dark-bg focus:ring-accent-teal w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-dark-border bg-dark-bg/60 cursor-pointer select-none">
                <div>
                  <span className="text-xs font-bold text-white block">SOP Document Ingestion Alerts</span>
                  <span className="text-[11px] text-dark-muted">Notify team members when new technical manuals are added to the workspace.</span>
                </div>
                <input
                  type="checkbox"
                  checked={emailSop}
                  onChange={(e) => setEmailSop(e.target.checked)}
                  className="rounded border-dark-border text-accent-teal bg-dark-bg focus:ring-accent-teal w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* SAVE BUTTON */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={updating}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-accent-teal hover:bg-accent-tealHover text-white text-xs font-bold shadow-lg shadow-accent-teal/20 transition-all duration-200 cursor-pointer"
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Workspace Settings
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SettingsPage;
