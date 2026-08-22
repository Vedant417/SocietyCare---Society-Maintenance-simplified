import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useComplaintPhoto } from '../hooks/useComplaintPhoto';
import { useToast } from '../context/ToastContext';
import DashboardLayout from '../layouts/DashboardLayout';
import { TimelineSkeleton } from '../components/SkeletonLoader';
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  User as UserIcon,
  CircleDot,
  Wrench,
  Loader2,
  ChevronDown,
  RotateCw,
  TrendingUp,
  Star
} from 'lucide-react';

const AdminComplaintDetail = () => {
  const { id } = useParams();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Form states for status update
  const [newStatus, setNewStatus] = useState('');
  const [updateNote, setUpdateNote] = useState('');
  const [newPriority, setNewPriority] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);

  // Authenticated photo loading (GridFS blob URL or legacy Cloudinary URL)
  const { photoSrc, photoLoading } = useComplaintPhoto(complaint);

  const fetchComplaintDetail = async () => {
    try {
      const response = await api.get(`/complaints/${id}`);
      if (response.data.success) {
        setComplaint(response.data.data);
        setNewStatus(response.data.data.status);
        setNewPriority(response.data.data.priority);
      }
    } catch (error) {
      console.error('Error fetching complaint details:', error);
      showToast('Failed to load complaint details.', 'error');
      navigate('/admin/complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const delay = new Promise((resolve) => setTimeout(resolve, 800));
    try {
      const [response] = await Promise.all([
        api.get(`/complaints/${id}`),
        delay
      ]);
      if (response.data.success) {
        setComplaint(response.data.data);
        setNewStatus(response.data.data.status);
        setNewPriority(response.data.data.priority);
      }
    } catch (error) {
      console.error('Error refreshing details:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchComplaintDetail();
  }, [id]);

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (newStatus === complaint.status && !updateNote.trim()) {
      showToast('Please change the status or provide a note.', 'warning');
      return;
    }

    setUpdatingStatus(true);
    try {
      const response = await api.patch(`/complaints/${id}/status`, {
        status: newStatus,
        note: updateNote.trim(),
      });

      if (response.data.success) {
        showToast('Complaint status updated successfully!', 'success');
        setUpdateNote('');
        fetchComplaintDetail(); // reload details and timeline
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to update status.';
      showToast(errMsg, 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePriorityChange = async (priority) => {
    if (priority === complaint.priority) return;

    setUpdatingPriority(true);
    try {
      const response = await api.patch(`/complaints/${id}/priority`, {
        priority,
      });

      if (response.data.success) {
        showToast('Priority updated successfully!', 'success');
        setNewPriority(priority);
        fetchComplaintDetail(); // reload
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to update priority.';
      showToast(errMsg, 'error');
    } finally {
      setUpdatingPriority(false);
    }
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

  const getTimelineIcon = (status) => {
    switch (status) {
      case 'OPEN':
        return <CircleDot className="w-5 h-5 text-indigo-500 bg-white" />;
      case 'IN_PROGRESS':
        return <Clock className="w-5 h-5 text-amber-500 bg-white" />;
      case 'RESOLVED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 bg-white" />;
      default:
        return <CircleDot className="w-5 h-5 text-gray-400 bg-white" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-6">
          <TimelineSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  if (!complaint) return null;

  const isResolved = complaint.status === 'RESOLVED';

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col gap-4">
          <Link
            to="/admin/complaints"
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-brand-primary transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Complaints
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl font-extrabold text-brand-charcoal">
                  Complaint #NF-{complaint.complaintNumber}
                </span>
                {complaint.isOverdue && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-red-50 text-red-600 border border-red-200 select-none uppercase animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Overdue
                  </span>
                )}
                {complaint.escalationLevel === 'ESCALATED' && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-orange-50 text-orange-600 border border-orange-200 select-none uppercase">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Escalated
                  </span>
                )}
                {(complaint.reopenCount || 0) > 0 && (
                  <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-purple-50 text-purple-600 border border-purple-200 select-none uppercase">
                    Reopened ×{complaint.reopenCount}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 font-medium">
                Registered on {new Date(complaint.createdAt).toLocaleDateString('en-US', { dateStyle: 'long' })}
              </p>
              {complaint.escalationLevel && complaint.escalationLevel !== 'HEALTHY' && (
                <p className="text-xs text-orange-600 font-semibold">
                  ⚠️ {complaint.escalationReason}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="flex items-center justify-center p-2.5 border border-brand-gray bg-white hover:bg-brand-gray-light text-brand-charcoal hover:text-brand-primary rounded-2xl transition-all active:scale-90 cursor-pointer shadow-sm select-none disabled:opacity-60 shrink-0"
                title="Refresh Details"
              >
                <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-primary' : ''}`} />
              </button>
              <span className={`px-3 py-1 text-xs font-bold rounded-full border uppercase ${getPriorityColor(complaint.priority)}`}>
                {complaint.priority} Priority
              </span>
              <span className={`px-3 py-1 text-xs font-bold rounded-full border uppercase ${getStatusColor(complaint.status)}`}>
                {complaint.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Core Layout Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Details & Controls Column (left) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Description & Resident metadata */}
            <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-6 space-y-6 shadow-sm">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Category</span>
                <p className="text-sm font-bold text-brand-charcoal">{complaint.category}</p>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description</span>
                <p className="text-sm text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">{complaint.description}</p>
              </div>

              {/* Resident info grid */}
              <div className="border-t border-brand-gray/30 pt-4 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Apartment</p>
                    <p className="text-xs font-bold text-brand-charcoal">Flat {complaint.resident?.apartmentNumber}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Resident Details</p>
                    <p className="text-xs font-bold text-brand-charcoal truncate" title={`${complaint.resident?.name} (${complaint.resident?.phone})`}>
                      {complaint.resident?.name} &bull; {complaint.resident?.phone}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Escalation Control Panel */}
            <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-6 shadow-sm space-y-6">
              <h3 className="text-sm font-extrabold text-brand-charcoal uppercase tracking-wider flex items-center gap-2">
                <Wrench className="w-4 h-4 text-brand-primary" />
                Escalation Panel
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Priority Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Change Priority Level
                  </label>
                  <div className="flex gap-2">
                    {['LOW', 'MEDIUM', 'HIGH'].map((p) => {
                      const isActive = newPriority === p;
                      const colors = {
                        LOW: 'border-gray-200 text-gray-500 hover:bg-gray-50 bg-white active:bg-gray-100',
                        MEDIUM: 'border-amber-200 text-amber-600 hover:bg-amber-50 bg-white active:bg-amber-100',
                        HIGH: 'border-red-200 text-red-600 hover:bg-red-50 bg-white active:bg-red-100',
                      };
                      const activeColors = {
                        LOW: 'bg-gray-100 border-gray-400 text-gray-700 shadow-sm',
                        MEDIUM: 'bg-amber-100 border-amber-400 text-amber-700 shadow-sm',
                        HIGH: 'bg-red-100 border-red-400 text-red-700 shadow-sm',
                      };

                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handlePriorityChange(p)}
                          disabled={updatingPriority}
                          className={`flex-1 py-2 px-3 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isActive ? activeColors[p] : colors[p]
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Status selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Operational Status
                  </label>
                  <div className="relative">
  <select
    value={newStatus}
    disabled={isResolved || updatingStatus}
    onChange={(e) => setNewStatus(e.target.value)}
    className="appearance-none block w-full px-3 pr-10 py-2 bg-brand-ivory/50 border border-brand-gray rounded-xl text-xs text-brand-charcoal font-semibold cursor-pointer outline-none focus:border-brand-primary disabled:opacity-60 disabled:cursor-not-allowed"
  >
    <option value="OPEN">Open</option>
    <option value="IN_PROGRESS">In Progress</option>
    <option value="RESOLVED">Resolved (Close Ticket)</option>
  </select>

  <ChevronDown
    className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal ${
      isResolved || updatingStatus ? 'opacity-50' : ''
    }`}
  />
</div>
                </div>
              </div>

              {/* Status Update Form (Submit Note) */}
              {!isResolved && (
                <form onSubmit={handleStatusSubmit} className="space-y-4 pt-4 border-t border-brand-gray/25">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Internal update / Resident notification note
                    </label>
                    <textarea
                      rows={3}
                      value={updateNote}
                      onChange={(e) => setUpdateNote(e.target.value)}
                      placeholder="Add optional notes (e.g. Plumber dispatched, technician arriving tomorrow at 3pm)..."
                      className="block w-full px-4 py-3 bg-brand-ivory/50 border border-brand-gray rounded-2xl text-xs text-brand-charcoal focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 focus:outline-none transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={updatingStatus}
                    className="flex items-center justify-center gap-2 py-3 px-5 bg-brand-primary hover:bg-brand-primary-light text-white font-bold text-xs rounded-2xl shadow-md transition-all transform cursor-pointer disabled:opacity-60"
                  >
                    {updatingStatus ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Update Ticket Status'
                    )}
                  </button>
                </form>
              )}

              {isResolved && (
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-700 leading-relaxed font-semibold">
                  This complaint has been marked as resolved and closed. Status changes are locked.
                </div>
              )}
            </div>

            {/* Photo attachment card */}
            {(photoSrc || photoLoading) && (
              <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-6 shadow-sm space-y-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  Photo Attachment
                </span>
                
                <div className="border border-brand-gray/50 rounded-2xl overflow-hidden aspect-video bg-black/5 flex items-center justify-center max-h-[350px]">
                  {photoLoading ? (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-xs">Loading photo...</span>
                    </div>
                  ) : (
                    <img 
                      src={photoSrc} 
                      alt="Complaint attachment" 
                      className="h-full object-contain"
                    />
                  )}
                </div>
              </div>
            )}

            {/* --- Feature 4: Satisfaction Rating (Admin Read-Only) --- */}
            {isResolved && complaint.satisfactionRating && (
              <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-6 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-brand-primary" />
                  <h3 className="text-sm font-extrabold text-brand-charcoal uppercase tracking-wider">Resident Satisfaction</h3>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {complaint.satisfactionRating === 'SATISFIED' && (
                    <span className="flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-bold text-emerald-700 bg-emerald-50 border-emerald-200">
                      <span className="text-xl">😊</span> Satisfied
                    </span>
                  )}
                  {complaint.satisfactionRating === 'NEUTRAL' && (
                    <span className="flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-bold text-amber-700 bg-amber-50 border-amber-200">
                      <span className="text-xl">😐</span> Neutral
                    </span>
                  )}
                  {complaint.satisfactionRating === 'NOT_SATISFIED' && (
                    <span className="flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-bold text-red-700 bg-red-50 border-red-200">
                      <span className="text-xl">😞</span> Not Satisfied
                    </span>
                  )}
                  {complaint.satisfactionSubmittedAt && (
                    <span className="text-xs text-gray-400 font-semibold">
                      Rated on {new Date(complaint.satisfactionSubmittedAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                    </span>
                  )}
                </div>
                {complaint.satisfactionFeedback && (
                  <div className="bg-brand-ivory/50 border border-brand-gray/30 rounded-xl p-3">
                    <p className="text-xs text-gray-500 italic leading-relaxed">"{complaint.satisfactionFeedback}"</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Timeline status list (right) */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-sm font-extrabold text-brand-charcoal uppercase tracking-wider">
              Status History Log
            </h2>

            <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-6 shadow-sm relative">
              
              {/* Vertical connecting line */}
              <div className="absolute left-[33px] top-[32px] bottom-[32px] w-[2px] bg-brand-gray" />

              <div className="space-y-8 relative">
                {complaint.history?.map((hist) => {
                  const date = new Date(hist.createdAt);
                  const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                  return (
                    <div key={hist.id} className="flex gap-4 relative">
                      
                      {/* Timeline icon */}
                      <div className="relative z-10 w-9 h-9 rounded-full bg-white border border-brand-gray/80 flex items-center justify-center shrink-0 shadow-sm">
                        {getTimelineIcon(hist.status)}
                      </div>

                      {/* Timeline contents */}
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-extrabold text-brand-charcoal">
                            {hist.status.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-gray-400 font-semibold">
                            &bull; {formattedDate}, {formattedTime}
                          </span>
                        </div>

                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          By: {hist.actor?.name} ({hist.actor?.role === 'ADMIN' ? 'Secretary' : 'Resident'})
                        </p>

                        {hist.note && (
                          <p className="text-xs text-gray-500 italic mt-1 bg-brand-ivory/50 px-3 py-1.5 rounded-xl border border-brand-gray/30 leading-relaxed">
                            "{hist.note}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};

export default AdminComplaintDetail;
