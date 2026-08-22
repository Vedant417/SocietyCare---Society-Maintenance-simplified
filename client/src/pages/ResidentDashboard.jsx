import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import EmptyState from '../components/EmptyState';
import { CardSkeleton } from '../components/SkeletonLoader';
import WeatherWidget from '../components/WeatherWidget';
import {
  FileText,
  Wrench,
  Hourglass,
  CheckCircle2,
  Plus,
  Pin,
  ChevronRight,
  ArrowUpRight,
  RotateCw,
  Activity,
  Droplets,
  Zap,
  Sparkles,
  Info,
  Calendar,
  X
} from 'lucide-react';

const ResidentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Society Pulse States
  const [pulse, setPulse] = useState(null);
  const [showPulseModal, setShowPulseModal] = useState(false);

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [complaintsRes, noticesRes] = await Promise.all([
        api.get('/complaints'),
        api.get('/notices'),
      ]);

      if (complaintsRes.data.success) {
        setComplaints(complaintsRes.data.data);
      }
      if (noticesRes.data.success) {
        setNotices(noticesRes.data.data.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPulse = async () => {
    try {
      const pulseRes = await api.get('/society-pulse');
      if (pulseRes.data.success) {
        setPulse(pulseRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching society pulse:', error);
    }
  };

  // Lock body scroll when showPulseModal is active
  useEffect(() => {
    if (showPulseModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showPulseModal]);

  // Setup data load and polling
  useEffect(() => {
    fetchData();
    fetchPulse();

    const interval = setInterval(() => {
      fetchPulse();
    }, 20000); // Poll every 20 seconds

    const handleFocus = () => {
      fetchPulse();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    const delay = new Promise((resolve) => setTimeout(resolve, 800));
    await Promise.all([fetchData(true), fetchPulse(), delay]);
    setRefreshing(false);
  };

  // Compute stats
  const total = complaints.length;
  const open = complaints.filter(c => c.status === 'OPEN').length;
  const inProgress = complaints.filter(c => c.status === 'IN_PROGRESS').length;
  const resolved = complaints.filter(c => c.status === 'RESOLVED').length;

  const stats = [
    { label: 'Total Complaints', value: total, icon: <FileText className="w-5 h-5" />, color: 'bg-[#FFF0E8] text-[#EF5B5B] border-[#EF5B5B]/10', link: '/complaints?status=ALL' },
    { label: 'Open', value: open, icon: <Wrench className="w-5 h-5" />, color: 'bg-[#EEEAFE] text-[#635BFF] border-[#635BFF]/10', link: '/complaints?status=OPEN' },
    { label: 'In Progress', value: inProgress, icon: <Hourglass className="w-5 h-5" />, color: 'bg-[#FFF8DD] text-[#F59E0B] border-[#F59E0B]/10', link: '/complaints?status=IN_PROGRESS' },
    { label: 'Resolved', value: resolved, icon: <CheckCircle2 className="w-5 h-5" />, color: 'bg-[#E8F8F1] text-[#20B486] border-[#20B486]/10', link: '/complaints?status=RESOLVED' },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-[#EAF2FF] text-[#7C6FF2] border border-[#7C6FF2]/15 uppercase">Open</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-[#FFF8DD] text-[#F59E0B] border border-[#F59E0B]/15 uppercase">In Progress</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-[#E8F8F1] text-[#20B486] border border-[#20B486]/15 uppercase">Resolved</span>;
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'HIGH':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#FFF0E8] text-[#EF5B5B] border border-[#EF5B5B]/15 uppercase">High</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#FFF8DD] text-[#F59E0B] border border-[#F59E0B]/15 uppercase">Medium</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-50 text-gray-500 border border-gray-200 uppercase">Low</span>;
      default:
        return null;
    }
  };

  // Helper styles for Society Pulse statuses
  const getPulseStatusBadge = (status) => {
    const s = status ? status.toUpperCase() : 'GOOD';
    switch (s) {
      case 'GOOD':
        return <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 uppercase">Good</span>;
      case 'NORMAL':
        return <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 uppercase">Normal</span>;
      case 'WARNING':
        return <span className="text-xs font-extrabold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100 uppercase">Warning</span>;
      case 'CRITICAL':
        return <span className="text-xs font-extrabold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100 uppercase animate-pulse">Critical</span>;
      default:
        return <span className="text-xs font-extrabold text-gray-500 bg-gray-50 px-2.5 py-0.5 rounded-full border border-gray-200 uppercase">{s}</span>;
    }
  };

  const calculateOverallStatus = (pulse) => {
    if (!pulse) return 'GOOD';

    const severity = {
      GOOD: 0,
      NORMAL: 1,
      WARNING: 2,
      CRITICAL: 3,
    };

    const levels = ['GOOD', 'NORMAL', 'WARNING', 'CRITICAL'];

    const values = [
      severity[(pulse.maintenance || 'GOOD').toUpperCase()],
      severity[(pulse.waterSupply || 'GOOD').toUpperCase()],
      severity[(pulse.power || 'GOOD').toUpperCase()],
      severity[(pulse.commonAreas || 'GOOD').toUpperCase()],
    ].sort((a, b) => a - b);

    // Take the center between the two middle values.
    // Math.ceil gives the appropriate middle level when there
    // is a tie between two neighboring statuses.
    const middle = Math.ceil((values[1] + values[2]) / 2);

    return levels[middle];
  };

  const getOverallStatusText = (status) => {
    const s = status ? status.toUpperCase() : 'GOOD';

    switch (s) {
      case 'GOOD':
        return (
          <span className="text-emerald-600 font-extrabold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            GOOD
          </span>
        );

      case 'NORMAL':
        return (
          <span className="text-blue-600 font-extrabold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block animate-pulse"></span>
            NORMAL
          </span>
        );

      case 'WARNING':
        return (
          <span className="text-amber-600 font-extrabold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block animate-pulse"></span>
            WARNING
          </span>
        );

      case 'CRITICAL':
        return (
          <span className="text-red-600 font-extrabold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block animate-pulse"></span>
            CRITICAL
          </span>
        );

      default:
        return (
          <span className="text-gray-600 font-extrabold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-500 inline-block animate-pulse"></span>
            GOOD
          </span>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Header / Refresh Controls */}
        <div className="flex justify-between items-center pb-2">
          <div>
            <h1 className="text-xl font-extrabold text-brand-charcoal tracking-tight">
              Overview
            </h1>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-2.5 border border-[#635BFF]/10 bg-white/60 hover:bg-[#EEEAFE] text-brand-charcoal hover:text-[#635BFF] font-bold text-xs rounded-2xl transition-all active:scale-95 cursor-pointer shadow-sm select-none disabled:opacity-60 shrink-0"
            title="Refresh Overview Data"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#635BFF]' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Quick CTA and stats block */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Quick Action CTA & Weather Column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-brand-primary p-6 rounded-3xl text-white flex flex-col justify-between shadow-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />

              <div className="relative">
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-white/10 px-2.5 py-1 rounded-full">
                  Quick Action
                </span>
                <h2 className="text-2xl font-extrabold mt-4 leading-tight tracking-tight">
                  Need something fixed?
                </h2>
                <p className="text-xs text-indigo-100 mt-2 font-semibold leading-relaxed">
                  Submit plumbing, electrical, elevator, or cleaning issues directly to the administration.
                </p>
              </div>

              <Link
                to="/complaints/new"
                className="mt-6 inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-white hover:bg-indigo-50 text-[#635BFF] font-bold text-xs uppercase tracking-wider rounded-2xl shadow-sm transition-all active:scale-98 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#635BFF] stroke-[3]" />
                Raise a Complaint
              </Link>
            </div>

            <WeatherWidget />
          </div>

          {/* Stats grid & Society Pulse Container */}
          <div className="lg:col-span-2 space-y-6 self-start">
            <div className="grid grid-cols-2 gap-4">
              {loading
                ? Array.from({ length: 4 }).map((_, idx) => <CardSkeleton key={idx} />)
                : stats.map((stat, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigate(stat.link)}
                    className="glass-card glass-card-hover p-6 flex flex-col justify-between shadow-sm cursor-pointer border hover:border-brand-primary/40 hover:shadow-md transition-all active:scale-[0.98]"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                        {stat.label}
                      </span>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${stat.color}`}>
                        {stat.icon}
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-3xl font-extrabold text-brand-charcoal tracking-tight">
                        {stat.value}
                      </span>
                    </div>
                  </div>
                ))}
            </div>

            {/* Society Pulse Widget */}
            {/* Society Pulse Widget */}
            {pulse && (
              <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-6 shadow-sm space-y-4 animate-fade-in transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-brand-primary/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-brand-primary" />
                    <h3 className="text-sm font-extrabold text-brand-charcoal uppercase tracking-wider">
                      Society Pulse
                    </h3>
                  </div>
                </div>

                {/* rest of your existing code stays exactly the same */}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 bg-gray-50/50 rounded-2xl border border-brand-gray/20 flex flex-col justify-between min-h-[80px]">
                    <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                      <Wrench className="w-3.5 h-3.5 text-brand-primary" />
                      Maintenance
                    </span>
                    <div className="mt-1">{getPulseStatusBadge(pulse.maintenance)}</div>
                  </div>
                  <div className="p-3 bg-gray-50/50 rounded-2xl border border-brand-gray/20 flex flex-col justify-between min-h-[80px]">
                    <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5 text-blue-400" />
                      Water Supply
                    </span>
                    <div className="mt-1">{getPulseStatusBadge(pulse.waterSupply)}</div>
                  </div>
                  <div className="p-3 bg-gray-50/50 rounded-2xl border border-brand-gray/20 flex flex-col justify-between min-h-[80px]">
                    <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      Power
                    </span>
                    <div className="mt-1">{getPulseStatusBadge(pulse.power)}</div>
                  </div>
                  <div className="p-3 bg-gray-50/50 rounded-2xl border border-brand-gray/20 flex flex-col justify-between min-h-[80px]">
                    <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      Common Areas
                    </span>
                    <div className="mt-1">{getPulseStatusBadge(pulse.commonAreas)}</div>
                  </div>
                </div>

                <div className="border-t border-brand-gray/20 pt-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                      Overall Society Status:
                    </span>

                    {getOverallStatusText(calculateOverallStatus(pulse))}
                  </div>

                  <div className="bg-gray-50/60 border border-brand-gray/25 rounded-2xl px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[11px] text-gray-400 font-semibold">
                        Last Updated:
                      </span>

                      <span className="text-[11px] font-bold text-brand-charcoal text-right">
                        {pulse.updatedAt
                          ? new Date(pulse.updatedAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })
                          : '—'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[11px] text-gray-400 font-semibold">
                        Updated By:
                      </span>

                      <span className="text-[11px] font-bold text-brand-charcoal text-right">
                        Secretary
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content splits: Complaints & Notice board */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Recent complaints */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-brand-charcoal">
                Recent Complaints
              </h2>
              {complaints.length > 0 && (
                <Link
                  to="/complaints"
                  className="text-xs font-bold text-brand-primary hover:text-brand-primary-light flex items-center gap-1 transition-colors"
                >
                  View All Complaints
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>

            {loading ? (
              <div className="bg-brand-card p-6 border border-brand-gray/40 rounded-3xl space-y-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-10 bg-gray-200 rounded" />
                <div className="h-10 bg-gray-200 rounded" />
              </div>
            ) : complaints.length === 0 ? (
              <EmptyState
                icon={<Wrench className="w-8 h-8" />}
                title="No complaints yet"
                description="Looks like everything is running smoothly. Keep up the clean record!"
                actionText="Raise your first complaint"
                onActionClick={() => navigate('/complaints/new')}
              />
            ) : (
              <div className="space-y-4">
                {complaints.slice(0, 3).map((complaint) => (
                  <div
                    key={complaint.id}
                    onClick={() => navigate(`/complaints/${complaint.id}`)}
                    className="bg-brand-card border border-brand-gray/40 rounded-3xl p-5 hover:border-brand-primary/40 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-brand-primary bg-brand-primary/5 px-2.5 py-0.5 rounded-full border border-brand-primary/10">
                          #NF-{complaint.complaintNumber}
                        </span>
                        <span className="text-xs font-bold text-gray-400">
                          {complaint.category}
                        </span>
                        {getPriorityBadge(complaint.priority)}
                      </div>
                      <h3 className="text-sm font-bold text-brand-charcoal line-clamp-1 group-hover:text-brand-primary transition-colors">
                        {complaint.description}
                      </h3>
                      <p className="text-xs text-gray-400 font-semibold">
                        Raised on {new Date(complaint.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-0 border-brand-gray/30 pt-3 sm:pt-0 shrink-0">
                      {getStatusBadge(complaint.status)}
                      <ArrowUpRight className="w-5 h-5 text-gray-300 group-hover:text-brand-primary transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Latest notices */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-brand-charcoal">
                Latest Notices
              </h2>
              {notices.length > 0 && (
                <Link
                  to="/notices"
                  className="text-xs font-bold text-brand-primary hover:text-brand-primary-light flex items-center gap-1 transition-colors"
                >
                  Notice Board
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>

            {loading ? (
              <div className="bg-brand-card p-6 border border-brand-gray/40 rounded-3xl space-y-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ) : notices.length === 0 ? (
              <div className="bg-brand-card p-6 border border-brand-gray/40 rounded-3xl text-center text-gray-400 font-bold text-sm py-12">
                No active announcements.
              </div>
            ) : (
              <div className="space-y-4">
                {notices.map((notice) => (
                  <div
                    key={notice.id}
                    onClick={() => navigate('/notices')}
                    className={`bg-brand-card border rounded-3xl p-5 shadow-sm space-y-3 relative group transition-all hover:shadow-md cursor-pointer hover:border-[#635BFF]/30 active:scale-[0.99] ${notice.isImportant
                      ? 'border-brand-warning/30 bg-amber-50/10'
                      : 'border-brand-gray/40'
                      }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-sm font-bold text-brand-charcoal group-hover:text-brand-primary transition-colors leading-tight">
                        {notice.title}
                      </h3>
                      {notice.isImportant && (
                        <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 shrink-0 select-none">
                          <Pin className="w-3 h-3 text-amber-500" />
                          Important
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                      {notice.content}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold">
                      {new Date(notice.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default ResidentDashboard;
