import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import DashboardLayout from '../layouts/DashboardLayout';
import EmptyState from '../components/EmptyState';
import { CardSkeleton } from '../components/SkeletonLoader';
import WeatherWidget from '../components/WeatherWidget';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  LineChart, 
  Line, 
  CartesianGrid 
} from 'recharts';
import { 
  FileText, 
  Wrench, 
  Hourglass, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  RotateCw,
  TrendingUp,
  RefreshCcw,
  Activity,
  BarChart2,
  Calendar,
  Star
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- Phase 2: Recurring Issues ---
  const [recurringIssues, setRecurringIssues] = useState([]);

  // --- Phase 5: Health Score ---
  const [healthData, setHealthData] = useState(null);

  const fetchDashboard = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [dashRes, recurringRes, healthRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/dashboard/recurring-issues'),
        api.get('/admin/dashboard/health-score'),
      ]);
      if (dashRes.data.success) setData(dashRes.data.data);
      if (recurringRes.data.success) setRecurringIssues(recurringRes.data.data);
      if (healthRes.data.success) setHealthData(healthRes.data.data);
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    const delay = new Promise((resolve) => setTimeout(resolve, 800));
    await Promise.all([fetchDashboard(true), delay]);
    setRefreshing(false);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-50 text-red-600 border-red-100';
      case 'MEDIUM': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'LOW': return 'bg-gray-50 text-gray-500 border-gray-200';
      default: return 'bg-gray-50 text-gray-500';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'IN_PROGRESS': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'RESOLVED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-gray-50 text-gray-500';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, idx) => <CardSkeleton key={idx} />)}
          </div>
          <div className="h-[300px] bg-brand-card rounded-3xl animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  const hasData = data && data.kpis && data.kpis.total > 0;

  const sortedNeedsAttention = data?.needsAttention
    ? [...data.needsAttention]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4)
    : [];

  const kpiCards = [
    { label: 'Total Complaints', value: data?.kpis?.total || 0, icon: <FileText className="w-5 h-5" />, color: 'bg-[#FFF0E8] text-[#EF5B5B] border-[#EF5B5B]/10', link: '/admin/complaints' },
    { label: 'Open', value: data?.kpis?.open || 0, icon: <Wrench className="w-5 h-5" />, color: 'bg-[#EEEAFE] text-[#635BFF] border-[#635BFF]/10', link: '/admin/complaints?status=OPEN' },
    { label: 'In Progress', value: data?.kpis?.inProgress || 0, icon: <Hourglass className="w-5 h-5" />, color: 'bg-[#FFF8DD] text-[#F59E0B] border-[#F59E0B]/10', link: '/admin/complaints?status=IN_PROGRESS' },
    { label: 'Resolved', value: data?.kpis?.resolved || 0, icon: <CheckCircle2 className="w-5 h-5" />, color: 'bg-[#E8F8F1] text-[#20B486] border-[#20B486]/10', link: '/admin/complaints?status=RESOLVED' },
    { label: 'Overdue', value: data?.kpis?.overdue || 0, icon: <AlertTriangle className="w-5 h-5" />, color: 'bg-[#FFF0E8] text-[#EF5B5B] border-[#EF5B5B]/10', link: '/admin/complaints?overdue=true' },
    { label: 'Escalated', value: data?.kpis?.escalated || 0, icon: <TrendingUp className="w-5 h-5" />, color: 'bg-orange-50 text-orange-600 border-orange-100', link: '/admin/complaints?overdue=true' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold text-brand-charcoal tracking-tight">
              SocietyCare Secretary Control
            </h1>
            <p className="text-xs text-text-secondary font-bold uppercase tracking-wider mt-0.5">
              Real-time analytics and escalation dashboard
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-2.5 border border-[#635BFF]/10 bg-white/60 hover:bg-[#EEEAFE] text-brand-charcoal hover:text-[#635BFF] font-bold text-xs rounded-2xl transition-all active:scale-95 cursor-pointer shadow-sm select-none disabled:opacity-60 shrink-0"
            title="Refresh Dashboard Data"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#635BFF]' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* 1. KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {kpiCards.map((kpi, idx) => (
            <div
              key={idx}
              onClick={() => navigate(kpi.link)}
              className={`glass-card glass-card-hover p-5 flex flex-col justify-between shadow-sm cursor-pointer group ${
                kpi.label === 'Overdue' && (data?.kpis?.overdue || 0) > 0 ? 'border-red-200 bg-[#FFF0E8]/50' : ''
              } ${
                kpi.label === 'Escalated' && (data?.kpis?.escalated || 0) > 0 ? 'border-orange-200 bg-orange-50/50' : ''
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  {kpi.label}
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${kpi.color}`}>
                  {kpi.icon}
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <span className={`text-2xl font-extrabold leading-none tracking-tight ${
                  (kpi.label === 'Overdue' && (data?.kpis?.overdue || 0) > 0) ? 'text-red-600' :
                  (kpi.label === 'Escalated' && (data?.kpis?.escalated || 0) > 0) ? 'text-orange-600' :
                  'text-brand-charcoal'
                }`}>
                  {kpi.value}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#635BFF] transition-colors" />
              </div>
            </div>
          ))}
        </div>

        {/* Weather & Needs Attention Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-1">
            <WeatherWidget />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-extrabold text-brand-charcoal uppercase tracking-wider">
              Needs Attention Right Now
            </h2>
            {sortedNeedsAttention.length === 0 ? (
              <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-6 text-center text-gray-400 font-bold text-xs py-8 shadow-sm">
                Nothing needs your attention right now.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedNeedsAttention.map((complaint) => (
                  <div
                    key={complaint.id}
                    onClick={() => navigate(`/admin/complaints/${complaint.id}`)}
                    className="bg-brand-card border border-brand-gray/40 rounded-3xl p-5 hover:border-brand-primary/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-4 group animate-fade-in"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-xs font-extrabold text-brand-primary bg-brand-primary/5 px-2.5 py-0.5 rounded-full border border-brand-primary/10">
                          #NF-{complaint.complaintNumber}
                        </span>
                        
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase border select-none ${
                          complaint.attentionReason === 'Overdue' || complaint.attentionReason === 'Escalated'
                            ? 'bg-red-50 text-red-600 border-red-100' 
                            : complaint.attentionReason === 'High Priority' 
                              ? 'bg-amber-50 text-amber-600 border-amber-100'
                              : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                        }`}>
                          {complaint.attentionReason}
                        </span>
                      </div>

                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                        Flat {complaint.resident?.apartmentNumber} &bull; {complaint.resident?.name}
                      </p>
                      
                      <p className="text-sm font-bold text-brand-charcoal leading-snug line-clamp-2 group-hover:text-brand-primary transition-colors">
                        {complaint.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-brand-gray/25 pt-3 select-none">
                      <div className="flex gap-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border ${getPriorityColor(complaint.priority)}`}>
                          {complaint.priority}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border ${getStatusColor(complaint.status)}`}>
                          {complaint.status.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold">
                        {new Date(complaint.updatedAt || complaint.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* If no complaints exist overall */}
        {!hasData ? (
          <EmptyState
            icon={<ShieldCheck className="w-8 h-8" />}
            title="Everything looks calm."
            description="No complaints have been reported yet. Enjoy the peaceful shift!"
          />
        ) : (
          <>

            {/* 3. Charts Block */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Donut Chart: Status Distribution */}
              <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[350px]">
                <div className="mb-4">
                  <h3 className="text-sm font-extrabold text-brand-charcoal uppercase tracking-wider">Complaints by Status</h3>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">Breakdown of operational workload</p>
                </div>
                
                <div className="h-48 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.charts?.status}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {data?.charts?.status?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px', fontWeight: 'bold' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Total indicator in center */}
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-2xl font-extrabold text-brand-charcoal">
                      {data?.kpis?.total}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Tickets
                    </span>
                  </div>
                </div>

                <div className="flex justify-center gap-6 mt-4 select-none">
                  {data?.charts?.status?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-bold text-gray-500">
                        {item.name} ({item.value})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bar Chart: Complaints by Category */}
              <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[350px]">
                <div className="mb-4">
                  <h3 className="text-sm font-extrabold text-brand-charcoal uppercase tracking-wider">Complaints by Category</h3>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">Categorized system issues</p>
                </div>

                <div className="h-56">
                  {data?.charts?.category?.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-gray-400 font-bold">No categories logged.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.charts?.category} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                        <XAxis dataKey="category" tick={{ fontSize: 9, fontWeight: 'bold', fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(79, 70, 229, 0.03)' }}
                          contentStyle={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '11px', fontWeight: 'bold' }}
                        />
                        <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Line Chart: Complaint Trend over time */}
              <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[350px]">
                <div className="mb-4">
                  <h3 className="text-sm font-extrabold text-brand-charcoal uppercase tracking-wider">7-Day Complaint Trend</h3>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">Daily ticket influx count</p>
                </div>

                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data?.charts?.trend} margin={{ top: 10, right: 15, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '11px', fontWeight: 'bold' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Complaints" 
                        stroke="#4F46E5" 
                        strokeWidth={3} 
                        dot={{ r: 4, strokeWidth: 2, fill: '#FFFFFF' }} 
                        activeDot={{ r: 6 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* --- Feature 2: Recurring Issues Section --- */}
            {recurringIssues.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-extrabold text-brand-charcoal uppercase tracking-wider flex items-center gap-2">
                    <RefreshCcw className="w-4 h-4 text-orange-500" />
                    Recurring Issues (Last 90 Days)
                  </h2>
                  <span className="text-xs text-gray-400 font-semibold">{recurringIssues.length} pattern{recurringIssues.length !== 1 ? 's' : ''} detected</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recurringIssues.map((issue) => (
                    <div
                      key={issue.category}
                      onClick={() => navigate(`/admin/complaints?category=${encodeURIComponent(issue.category)}`)}
                      className="bg-brand-card border border-orange-100 rounded-3xl p-5 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3 group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-brand-charcoal">{issue.category}</span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100 uppercase">
                            {issue.count}x
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                          {issue.unresolvedCount} unresolved · Last: {new Date(issue.latestDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 h-1.5 bg-brand-gray/40 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-400 rounded-full"
                            style={{ width: `${Math.min(100, (issue.unresolvedCount / issue.count) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold ml-2">{Math.round((issue.unresolvedCount / issue.count) * 100)}% open</span>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-orange-500 transition-colors ml-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- Feature 5: Society Maintenance Health Dashboard --- */}
            {healthData && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-extrabold text-brand-charcoal uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-brand-primary" />
                    Society Maintenance Health
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                  {/* Score Gauge */}
                  <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center gap-4">
                    <div className="relative flex items-center justify-center">
                      <svg width="140" height="140" viewBox="0 0 140 140">
                        <circle cx="70" cy="70" r="56" fill="none" stroke="#F3F4F6" strokeWidth="12" />
                        <circle
                          cx="70" cy="70" r="56"
                          fill="none"
                          stroke={healthData.score >= 75 ? '#20B486' : healthData.score >= 50 ? '#F59E0B' : '#EF5B5B'}
                          strokeWidth="12"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 56}`}
                          strokeDashoffset={`${2 * Math.PI * 56 * (1 - healthData.score / 100)}`}
                          transform="rotate(-90 70 70)"
                          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className={`text-3xl font-extrabold leading-none ${
                          healthData.score >= 75 ? 'text-emerald-600' : healthData.score >= 50 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {healthData.score}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">/ 100</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-extrabold text-brand-charcoal">Society Health Score</p>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">
                        {healthData.score >= 75 ? 'Excellent — Keep it up!' : healthData.score >= 50 ? 'Fair — Room for improvement' : 'Needs attention'}
                      </p>
                    </div>
                  </div>

                  {/* Breakdown Bars */}
                  <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-extrabold text-brand-charcoal uppercase tracking-wider">Score Breakdown</h3>
                    {Object.values(healthData.breakdown).map((item) => (
                      <div key={item.label} className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-500">{item.label}</span>
                          <span className="text-xs font-extrabold text-brand-charcoal">{item.score}<span className="text-gray-400 font-semibold">/{item.max}</span></span>
                        </div>
                        <div className="h-2 bg-brand-gray/30 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              item.score / item.max >= 0.75 ? 'bg-emerald-400' : item.score / item.max >= 0.5 ? 'bg-amber-400' : 'bg-red-400'
                            }`}
                            style={{ width: `${(item.score / item.max) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Monthly Insights */}
                  <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-extrabold text-brand-charcoal uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-brand-primary" />
                      Monthly Insights
                    </h3>
                    <div className="space-y-3">
                      {[
                        {
                          label: 'Complaints This Month',
                          value: healthData.monthlyInsights.complaintsThisMonth,
                          sub: healthData.monthlyInsights.monthChange !== 0
                            ? `${healthData.monthlyInsights.monthChange > 0 ? '+' : ''}${healthData.monthlyInsights.monthChange}% vs last month`
                            : 'Same as last month',
                          subColor: healthData.monthlyInsights.monthChange > 0 ? 'text-red-500' : 'text-emerald-500',
                        },
                        {
                          label: 'Most Common Category',
                          value: healthData.monthlyInsights.mostCommonCategory,
                        },
                        {
                          label: 'Most Affected Area',
                          value: healthData.monthlyInsights.mostAffectedArea,
                        },
                        {
                          label: 'Avg Resolution Time',
                          value: healthData.monthlyInsights.avgResolutionTime ? `${healthData.monthlyInsights.avgResolutionTime} days` : '—',
                        },
                        {
                          label: 'Top Recurring Issue',
                          value: healthData.monthlyInsights.topRecurringIssue || '—',
                        },
                        {
                          label: 'Satisfaction Ratings',
                          value: `${healthData.monthlyInsights.ratingsCount} submitted`,
                        },
                      ].map((insight) => (
                        <div key={insight.label} className="flex justify-between items-start gap-2 py-1.5 border-b border-brand-gray/20 last:border-0">
                          <span className="text-xs text-gray-400 font-semibold shrink-0">{insight.label}</span>
                          <div className="text-right">
                            <span className="text-xs font-extrabold text-brand-charcoal">{insight.value}</span>
                            {insight.sub && (
                              <p className={`text-[10px] font-semibold mt-0.5 ${insight.subColor}`}>{insight.sub}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

          </>
        )}

      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
