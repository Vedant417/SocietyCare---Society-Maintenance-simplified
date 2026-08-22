import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import DashboardLayout from '../layouts/DashboardLayout';
import {
  Activity,
  Wrench,
  Droplets,
  Zap,
  Sparkles,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown
} from 'lucide-react';

const AdminSocietyPulse = () => {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Status states
  const [maintenance, setMaintenance] = useState('GOOD');
  const [waterSupply, setWaterSupply] = useState('NORMAL');
  const [power, setPower] = useState('GOOD');
  const [commonAreas, setCommonAreas] = useState('GOOD');

  // Fetch initial pulse status
  const fetchPulse = async () => {
    setLoading(true);
    try {
      const response = await api.get('/society-pulse');
      if (response.data.success) {
        const data = response.data.data;
        setMaintenance(data.maintenance);
        setWaterSupply(data.waterSupply);
        setPower(data.power);
        setCommonAreas(data.commonAreas);
      }
    } catch (error) {
      console.error('Failed to load society pulse:', error);
      showToast('Failed to load society pulse status.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPulse();
  }, []);

  // Calculate overall status dynamically
  const getOverallStatus = () => {
    const statuses = [maintenance, waterSupply, power, commonAreas];
    if (statuses.includes('CRITICAL')) return 'CRITICAL';
    if (statuses.includes('WARNING')) return 'WARNING';
    return 'GOOD';
  };

  const overall = getOverallStatus();

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.patch('/society-pulse', {
        maintenance,
        waterSupply,
        power,
        commonAreas
      });
      if (response.data.success) {
        showToast('Society pulse updated successfully!', 'success');
      }
    } catch (error) {
      console.error('Failed to update society pulse:', error);
      showToast(error.response?.data?.message || 'Failed to update society pulse.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getOverallBadge = (status) => {
    switch (status) {
      case 'GOOD':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Good
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Warning
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-red-50 text-red-600 border border-red-200 uppercase tracking-wider animate-pulse">
            <XCircle className="w-3.5 h-3.5 text-red-500" />
            Critical
          </span>
        );
      default:
        return null;
    }
  };

  const selectOptions = [
    { label: 'Good', value: 'GOOD' },
    { label: 'Normal', value: 'NORMAL' },
    { label: 'Warning', value: 'WARNING' },
    { label: 'Critical', value: 'CRITICAL' }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header Title block */}
        <div>
          <h1 className="text-2xl font-extrabold text-brand-charcoal tracking-tight">
            Society Pulse Management
          </h1>
          <p className="text-sm text-gray-400 font-medium mt-0.5">
            Manage the current status of essential society services.
          </p>
        </div>

        {loading ? (
          <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
            <span className="text-xs text-gray-400 font-bold mt-2">Loading pulse settings...</span>
          </div>
        ) : (
          <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-6 shadow-sm space-y-6">

            {/* Status Dropdowns Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Maintenance Dropdown */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-brand-primary" />
                  Maintenance Status
                </label>
                <div className="relative">
                  <select
                    value={maintenance}
                    onChange={(e) => setMaintenance(e.target.value)}
                    className="appearance-none w-full bg-[#FDFBF7] border border-brand-gray/40 rounded-2xl px-4 pr-12 py-3.5 text-xs font-bold text-brand-charcoal outline-none focus:border-brand-primary/50 focus:shadow-sm cursor-pointer"
                  >
                    {selectOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal" />
                </div>
              </div>

              {/* Water Supply Dropdown */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-blue-400" />
                  Water Supply Status
                </label>
                <div className="relative">
                  <select
                    value={waterSupply}
                    onChange={(e) => setWaterSupply(e.target.value)}
                    className="appearance-none w-full bg-[#FDFBF7] border border-brand-gray/40 rounded-2xl px-4 pr-12 py-3.5 text-xs font-bold text-brand-charcoal outline-none focus:border-brand-primary/50 focus:shadow-sm cursor-pointer"
                  >
                    {selectOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal" />
                </div>
              </div>

              {/* Power Dropdown */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Power Status
                </label>
                <div className="relative">
                  <select
                    value={power}
                    onChange={(e) => setPower(e.target.value)}
                    className="appearance-none w-full bg-[#FDFBF7] border border-brand-gray/40 rounded-2xl px-4 pr-12 py-3.5 text-xs font-bold text-brand-charcoal outline-none focus:border-brand-primary/50 focus:shadow-sm cursor-pointer"
                  >
                    {selectOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal" />
                </div>
              </div>

              {/* Common Areas Dropdown */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Common Areas Status
                </label>
                <div className="relative">
                  <select
                    value={commonAreas}
                    onChange={(e) => setCommonAreas(e.target.value)}
                    className="appearance-none w-full bg-[#FDFBF7] border border-brand-gray/40 rounded-2xl px-4 pr-12 py-3.5 text-xs font-bold text-brand-charcoal outline-none focus:border-brand-primary/50 focus:shadow-sm cursor-pointer"
                  >
                    {selectOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal" />
                </div>
              </div>

            </div>

            {/* Calculated Overall Status display banner */}
            <div className="border-t border-brand-gray/25 pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
  <div className="flex items-center justify-between sm:justify-start gap-2.5 min-w-0">
    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider leading-relaxed">
      Calculated Overall Status:
    </span>

    <div className="shrink-0">
      {getOverallBadge(overall)}
    </div>
  </div>

  <button
    onClick={handleSave}
    disabled={saving}
    className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 py-3.5 px-6 bg-[#635BFF] hover:bg-[#635BFF]/95 disabled:bg-gray-400 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow transition-all active:scale-97 cursor-pointer"
  >
    {saving ? (
      <>
        <Loader2 className="w-4 h-4 animate-spin text-white" />
        Saving...
      </>
    ) : (
      <>
        <Save className="w-4 h-4 text-white" />
        Save Updates
      </>
    )}
  </button>
</div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default AdminSocietyPulse;
