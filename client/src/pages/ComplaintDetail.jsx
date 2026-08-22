import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useComplaintPhoto } from '../hooks/useComplaintPhoto';
import { useAuth } from '../context/AuthContext';
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
  RotateCw,
  RotateCcw,
  Loader2,
  Star,
  MessageSquare
} from 'lucide-react';

const ComplaintDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- Feature 4: Satisfaction ---
  const [selectedRating, setSelectedRating] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // --- Feature 4: Reopen ---
  const [reopenReason, setReopenReason] = useState('');
  const [showReopenForm, setShowReopenForm] = useState(false);
  const [reopening, setReopening] = useState(false);

  // Authenticated photo loading (GridFS blob URL or legacy Cloudinary URL)
  const { photoSrc, photoLoading } = useComplaintPhoto(complaint);

  const fetchComplaintDetail = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await api.get(`/complaints/${id}`);
      if (response.data.success) {
        setComplaint(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching complaint details:', error);
      showToast('Failed to load complaint details.', 'error');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintDetail();
  }, [id, navigate, showToast]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const delay = new Promise((resolve) => setTimeout(resolve, 800));
    await Promise.all([fetchComplaintDetail(true), delay]);
    setRefreshing(false);
  };

  const handleSubmitSatisfaction = async () => {
    if (!selectedRating) {
      showToast('Please select a rating first.', 'warning');
      return;
    }
    setSubmittingRating(true);
    try {
      const response = await api.patch(`/complaints/${id}/satisfaction`, {
        rating: selectedRating,
        feedback: feedbackText.trim(),
      });
      if (response.data.success) {
        showToast('Thank you for your feedback!', 'success');
        fetchComplaintDetail(true);
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to submit rating.', 'error');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleReopen = async () => {
    setReopening(true);
    try {
      const response = await api.patch(`/complaints/${id}/reopen`, {
        reason: reopenReason.trim(),
      });
      if (response.data.success) {
        showToast('Complaint reopened successfully.', 'success');
        setShowReopenForm(false);
        setReopenReason('');
        fetchComplaintDetail(true);
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to reopen complaint.', 'error');
    } finally {
      setReopening(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase select-none">Open</span>;
      case 'IN_PROGRESS':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-600 border border-amber-100 uppercase select-none">In Progress</span>;
      case 'RESOLVED':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase select-none">Resolved</span>;
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'HIGH':
        return <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-red-50 text-red-600 border border-red-100 uppercase select-none">High</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 text-amber-600 border border-amber-100 uppercase select-none">Medium</span>;
      case 'LOW':
        return <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-gray-50 text-gray-500 border border-gray-200 uppercase select-none">Low</span>;
      default:
        return null;
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

  const getRatingEmoji = (rating) => {
    switch (rating) {
      case 'SATISFIED': return { emoji: '😊', label: 'Satisfied', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
      case 'NEUTRAL': return { emoji: '😐', label: 'Neutral', color: 'text-amber-600 bg-amber-50 border-amber-200' };
      case 'NOT_SATISFIED': return { emoji: '😞', label: 'Not Satisfied', color: 'text-red-600 bg-red-50 border-red-200' };
      default: return null;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <TimelineSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  if (!complaint) return null;

  const isResolved = complaint.status === 'RESOLVED';
  const hasRated = !!complaint.satisfactionRating;
  const ratingInfo = hasRated ? getRatingEmoji(complaint.satisfactionRating) : null;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col gap-4">
          <Link
            to={user?.role === 'ADMIN' ? '/admin/complaints' : '/complaints'}
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
                {(complaint.reopenCount || 0) > 0 && (
                  <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-purple-50 text-purple-600 border border-purple-200 select-none uppercase">
                    Reopened ×{complaint.reopenCount}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 font-medium">
                Registered on {new Date(complaint.createdAt).toLocaleDateString('en-US', { dateStyle: 'long' })}
              </p>
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
              {getPriorityBadge(complaint.priority)}
              {getStatusBadge(complaint.status)}
            </div>
          </div>
        </div>

        {/* Complaint details and timeline Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main info details (left) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Description card */}
            <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-6 space-y-6 shadow-sm">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Category
                </span>
                <p className="text-sm font-bold text-brand-charcoal">
                  {complaint.category}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Description
                </span>
                <p className="text-sm text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">
                  {complaint.description}
                </p>
              </div>

              {/* Apartment and Resident Details */}
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
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Resident</p>
                    <p className="text-xs font-bold text-brand-charcoal">{complaint.resident?.name}</p>
                  </div>
                </div>
              </div>
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

            {/* --- Feature 4: Satisfaction Rating Card --- */}
            {isResolved && (
              <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-6 shadow-sm space-y-4 animate-fade-in">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-brand-primary" />
                  <h3 className="text-sm font-extrabold text-brand-charcoal uppercase tracking-wider">
                    Resident Satisfaction
                  </h3>
                </div>

                {hasRated ? (
                  /* Already rated — show result */
                  <div className="space-y-3">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-bold ${ratingInfo?.color}`}>
                      <span className="text-xl">{ratingInfo?.emoji}</span>
                      <span>{ratingInfo?.label}</span>
                    </div>
                    {complaint.satisfactionFeedback && (
                      <div className="bg-brand-ivory/50 border border-brand-gray/30 rounded-xl p-3">
                        <p className="text-xs text-gray-500 italic leading-relaxed">
                          "{complaint.satisfactionFeedback}"
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold mt-1">
                          Submitted {new Date(complaint.satisfactionSubmittedAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Not yet rated */
                  <div className="space-y-4">
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                      How satisfied are you with the resolution of this complaint?
                    </p>

                    {/* Emoji rating buttons */}
                    <div className="flex gap-3 flex-wrap">
                      {[
                        { value: 'SATISFIED', emoji: '😊', label: 'Satisfied', active: 'bg-emerald-50 border-emerald-400 text-emerald-700', inactive: 'bg-white border-brand-gray text-gray-500 hover:border-emerald-300 hover:bg-emerald-50/50' },
                        { value: 'NEUTRAL', emoji: '😐', label: 'Neutral', active: 'bg-amber-50 border-amber-400 text-amber-700', inactive: 'bg-white border-brand-gray text-gray-500 hover:border-amber-300 hover:bg-amber-50/50' },
                        { value: 'NOT_SATISFIED', emoji: '😞', label: 'Not Satisfied', active: 'bg-red-50 border-red-400 text-red-700', inactive: 'bg-white border-brand-gray text-gray-500 hover:border-red-300 hover:bg-red-50/50' },
                      ].map((r) => (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setSelectedRating(r.value)}
                          className={`flex flex-col items-center gap-1 px-4 py-2.5 border-2 rounded-2xl transition-all cursor-pointer select-none text-xs font-bold ${
                            selectedRating === r.value ? r.active : r.inactive
                          }`}
                        >
                          <span className="text-2xl">{r.emoji}</span>
                          <span>{r.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Optional feedback */}
                    <textarea
                      rows={2}
                      placeholder="Optional: Share any additional feedback..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      className="block w-full px-4 py-3 bg-brand-ivory/50 border border-brand-gray rounded-2xl text-xs text-brand-charcoal focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 focus:outline-none transition-all resize-none"
                    />

                    <div className="flex gap-3 items-center flex-wrap">
                      <button
                        type="button"
                        onClick={handleSubmitSatisfaction}
                        disabled={submittingRating || !selectedRating}
                        className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-light text-white font-bold text-xs rounded-2xl shadow-md transition-all cursor-pointer disabled:opacity-60"
                      >
                        {submittingRating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5" />}
                        Submit Rating
                      </button>

                      {/* Reopen button */}
                      {!showReopenForm && (
                        <button
                          type="button"
                          onClick={() => setShowReopenForm(true)}
                          className="flex items-center gap-2 px-5 py-2.5 border border-brand-gray bg-white text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 font-bold text-xs rounded-2xl transition-all cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reopen Complaint
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Reopen form */}
                {showReopenForm && !hasRated && (
                  <div className="border-t border-brand-gray/25 pt-4 space-y-3 animate-fade-in">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Reopen this complaint</p>
                    <p className="text-xs text-gray-400 font-medium">
                      Your complete complaint history will be preserved. A new OPEN entry will be added.
                    </p>
                    <textarea
                      rows={2}
                      placeholder="Optional: Why are you reopening this complaint?"
                      value={reopenReason}
                      onChange={(e) => setReopenReason(e.target.value)}
                      className="block w-full px-4 py-3 bg-brand-ivory/50 border border-brand-gray rounded-2xl text-xs text-brand-charcoal focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 focus:outline-none transition-all resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleReopen}
                        disabled={reopening}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-2xl transition-all cursor-pointer disabled:opacity-60"
                      >
                        {reopening ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                        Confirm Reopen
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowReopenForm(false)}
                        className="px-4 py-2.5 border border-brand-gray text-gray-500 font-bold text-xs rounded-2xl hover:bg-brand-gray-light transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Timeline status list (right) */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-sm font-extrabold text-brand-charcoal uppercase tracking-wider">
              Status Timeline
            </h2>

            <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-6 shadow-sm relative">
              
              {/* Vertical connecting line */}
              <div className="absolute left-[33px] top-[32px] bottom-[32px] w-[2px] bg-brand-gray" />

              <div className="space-y-8 relative">
                {complaint.history?.map((hist, idx) => {
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

export default ComplaintDetail;
