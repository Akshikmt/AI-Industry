import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Search, AlertCircle, Eye, Loader2, Plus, X, Server, Building2, Tag, Activity } from 'lucide-react';

interface Asset {
  id: string;
  assetName: string;
  equipmentTag: string;
  department: string;
  status?: string;
  description?: string;
  location?: string;
}

const AssetsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Asset Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAssetName, setNewAssetName] = useState('');
  const [newEquipmentTag, setNewEquipmentTag] = useState('');
  const [newDepartment, setNewDepartment] = useState('Operations');
  const [newStatus, setNewStatus] = useState('Optimal');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadAssets = async () => {
    try {
      setError(null);
      const data = await apiFetch('/assets');
      const mapped = data.assets.map((a: Asset) => ({
        ...a,
        status: a.status || (a.equipmentTag === 'T-202' ? 'Review Needed' : 'Optimal')
      }));
      setAssets(mapped);
    } catch (err: any) {
      setError('Failed to fetch assets catalog from server.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetName.trim() || !newEquipmentTag.trim() || !newDepartment.trim()) {
      setModalError('Asset Name, Equipment Tag, and Department are required.');
      return;
    }

    setSubmitting(true);
    setModalError(null);

    try {
      const response = await apiFetch('/assets', {
        method: 'POST',
        body: JSON.stringify({
          assetName: newAssetName.trim(),
          equipmentTag: newEquipmentTag.trim(),
          department: newDepartment.trim(),
          status: newStatus,
          description: newDescription.trim()
        })
      });

      setAssets(prev => [response.asset, ...prev]);
      showToast(`Equipment Asset "${response.asset.assetName} (${response.asset.equipmentTag})" added successfully!`, 'success');
      setShowAddModal(false);
      setNewAssetName('');
      setNewEquipmentTag('');
      setNewDepartment('Operations');
      setNewStatus('Optimal');
      setNewDescription('');
    } catch (err: any) {
      setModalError(err.message || 'Failed to add new asset.');
      showToast(err.message || 'Failed to add asset.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAssets = assets.filter(
    a => a.assetName.toLowerCase().includes(search.toLowerCase()) || a.equipmentTag.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header with Add Asset Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-border pb-4">
        <div>
          <h1 className="text-[1.5rem] font-extrabold text-white font-sans">Industrial Assets Catalog</h1>
          <p className="text-xs text-dark-muted mt-1">Navigate equipment details, inspection logs, and technical drawings</p>
        </div>

        {user?.role === 'admin' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent-teal to-accent-blue hover:from-accent-tealHover hover:to-accent-blue text-[#ffffff] text-xs font-bold shadow-glow-teal flex items-center gap-2 cursor-pointer transition-all shrink-0"
          >
            <Plus className="w-4 h-4 text-[#ffffff]" />
            <span className="text-[#ffffff]">Add Asset</span>
          </button>
        )}
      </div>

      {/* Search Filter */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-muted">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          placeholder="Filter by asset name or equipment tag (e.g., P-101)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-dark-border bg-dark-card/50 text-xs text-white placeholder-dark-muted focus:border-accent-teal focus:ring-1 focus:ring-accent-teal outline-none transition-colors"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-dark-muted">
          <Loader2 className="w-8 h-8 animate-spin text-accent-teal" />
          <p className="text-xs mt-2 font-semibold">Synchronizing asset master data...</p>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 p-4 rounded-lg border border-accent-rose/20 bg-accent-rose/5 text-xs text-accent-rose">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      ) : (
        /* Assets Grid */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              onClick={() => navigate(`/dashboard/assets/${asset.id}`)}
              className="glassmorphism p-6 rounded-xl hover:border-accent-teal/40 hover:shadow-glow-teal transition-all duration-300 relative group cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="px-2 py-0.5 rounded bg-accent-teal/10 text-accent-teal text-[10px] font-bold tracking-wider font-mono">
                  {asset.equipmentTag}
                </span>
                <span className="text-[10px] text-dark-muted font-bold uppercase">{asset.department}</span>
              </div>

              <h3 className="font-extrabold text-sm text-white font-sans line-clamp-1">{asset.assetName}</h3>

              <div className="mt-4 pt-4 border-t border-dark-border flex items-center justify-between text-xs text-dark-muted">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${asset.status === 'Optimal' ? 'bg-emerald-500' : 'bg-accent-amber animate-pulse'}`}></span>
                  {asset.status || 'Optimal'}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/dashboard/assets/${asset.id}`);
                  }}
                  className="flex items-center gap-1 text-[11px] text-accent-teal hover:underline font-bold cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Inspect Specs
                </button>
              </div>
            </div>
          ))}
          {filteredAssets.length === 0 && (
            <div className="col-span-full py-12 text-center text-xs text-dark-muted">
              No assets match your search filters.
            </div>
          )}
        </div>
      )}

      {/* Add Asset Modal */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn font-sans">
          <div className="w-full max-w-lg bg-dark-card border border-dark-border rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-dark-border pb-4">
              <div>
                <h3 className="text-base font-extrabold text-white">Add Industrial Asset</h3>
                <p className="text-xs text-dark-muted">Register a new equipment asset into master database</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-dark-muted hover:text-white hover:bg-dark-border/40 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAsset} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-white block">
                  Asset Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Centrifugal Boiler Feed Pump P-303"
                  value={newAssetName}
                  onChange={(e) => setNewAssetName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-dark-border bg-dark-bg text-white placeholder-dark-muted focus:border-accent-teal outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-white block">
                    Equipment Tag *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. P-303"
                    value={newEquipmentTag}
                    onChange={(e) => setNewEquipmentTag(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-dark-border bg-dark-bg text-white placeholder-dark-muted focus:border-accent-teal outline-none font-mono uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-white block">
                    Department *
                  </label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-dark-border bg-dark-bg text-white outline-none cursor-pointer"
                  >
                    <option value="Operations">Operations</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Safety & Compliance">Safety & Compliance</option>
                    <option value="Refinery Unit">Refinery Unit</option>
                    <option value="Electrical & Power">Electrical & Power</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-white block">
                  Initial Operational Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-dark-border bg-dark-bg text-white outline-none cursor-pointer"
                >
                  <option value="Optimal">Optimal (Normal Operational)</option>
                  <option value="Review Needed">Review Needed (Inspection Warning)</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-white block">Equipment Notes / Specs Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="e.g. High-pressure boiler pump. Max flow rate 120m3/h, operating temperature 180°C..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-dark-border bg-dark-bg text-white placeholder-dark-muted focus:border-accent-teal outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-dark-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl border border-dark-border bg-dark-bg text-dark-muted hover:text-white font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-teal to-accent-blue hover:from-accent-tealHover hover:to-accent-blue text-[#ffffff] font-bold shadow-glow-teal flex items-center gap-2 cursor-pointer transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#ffffff]" />
                      <span className="text-[#ffffff]">Creating Asset...</span>
                    </>
                  ) : (
                    <span className="text-[#ffffff]">Create Industrial Asset</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AssetsPage;
