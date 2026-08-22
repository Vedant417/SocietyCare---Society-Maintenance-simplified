import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import DashboardLayout from '../layouts/DashboardLayout';
import { Settings as SettingsIcon, Loader2, AlertTriangle, HelpCircle } from 'lucide-react';

const AdminSettings = () => {
  const { showToast } = useToast();
  
  const [overdueDays, setOverdueDays] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/admin/settings');
        if (response.data.success) {
          setOverdueDays(response.data.data.complaint_overdue_days || '3');
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        showToast('Failed to load settings.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const daysNum = Number(overdueDays);
    
    if (isNaN(daysNum) || daysNum <= 0 || !Number.isInteger(daysNum)) {
      showToast('Overdue days must be a positive integer.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const response = await api.patch('/admin/settings', {
        complaint_overdue_days: daysNum,
      });

      if (response.data.success) {
        showToast('System settings updated successfully!', 'success');
        setOverdueDays(String(response.data.data.complaint_overdue_days));
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-brand-charcoal">
            System Settings
          </h1>
          <p className="text-sm text-gray-400 font-medium">
            Configure default settings and automated policies for complaint handling
          </p>
        </div>

        {loading ? (
          <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        ) : (
          <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <h3 className="text-sm font-extrabold text-brand-charcoal uppercase tracking-wider flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-brand-primary" />
              General Thresholds
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Overdue Threshold setting */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Complaint Overdue Threshold (Days)
                  </label>
                  <div className="relative group shrink-0">
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-pointer" />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-48 bg-brand-charcoal text-white text-[10px] p-2.5 rounded-lg shadow-lg leading-relaxed z-10">
                      Unresolved complaints older than this value will be marked as "Overdue" and sorted to the top of list grids.
                    </div>
                  </div>
                </div>

                <div className="relative max-w-xs">
  <input
    type="number"
    min="1"
    step="1"
    value={overdueDays}
    onChange={(e) => setOverdueDays(e.target.value)}
    className="block w-full px-4 pr-16 py-3 bg-brand-ivory/50 border border-brand-gray rounded-2xl text-sm text-brand-charcoal focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 focus:outline-none transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
  />

  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-xs text-gray-400 font-bold">
    Days
  </div>
</div>
              </div>

              {/* Policy note */}
              <div className="bg-brand-ivory border border-brand-gray/50 rounded-2xl p-4 flex gap-3 text-xs text-gray-500 leading-relaxed font-semibold">
                <AlertTriangle className="w-5 h-5 text-gray-400 shrink-0" />
                <p>
                  Changing this threshold will dynamically recalculate the overdue state for all open/in-progress complaints across both the resident and administrator dashboards.
                </p>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 py-3.5 px-6 bg-brand-primary hover:bg-brand-primary-light text-white font-bold text-sm rounded-2xl shadow-md transition-all transform cursor-pointer disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving settings...
                  </>
                ) : (
                  'Save Settings'
                )}
              </button>

            </form>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
