import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import DashboardLayout from '../layouts/DashboardLayout';
import EmptyState from '../components/EmptyState';
import { CardSkeleton } from '../components/SkeletonLoader';
import { 
  Megaphone, 
  Pin, 
  Plus, 
  Trash2, 
  Edit2, 
  Calendar, 
  X, 
  Loader2,
  AlertTriangle
} from 'lucide-react';

const AdminNotices = () => {
  const { showToast } = useToast();
  
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal States
  const [editingNotice, setEditingNotice] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editIsImportant, setEditIsImportant] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete Confirm States
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchNotices = async () => {
    try {
      const response = await api.get('/notices');
      if (response.data.success) {
        setNotices(response.data.data);
      }
    } catch (error) {
      console.error('Error loading notices:', error);
      showToast('Failed to load notices.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Lock body scroll when editingNotice or deletingId modals are active
  useEffect(() => {
    if (editingNotice || deletingId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [editingNotice, deletingId]);

  useEffect(() => {
    fetchNotices();
  }, []);

  // Handle Edit Modal Open
  const handleOpenEdit = (notice) => {
    setEditingNotice(notice);
    setEditTitle(notice.title);
    setEditContent(notice.content);
    setEditIsImportant(notice.isImportant);
  };

  // Submit Edit Form
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim()) {
      showToast('Title and Content are required.', 'warning');
      return;
    }

    setSavingEdit(true);
    try {
      const response = await api.patch(`/notices/${editingNotice.id}`, {
        title: editTitle.trim(),
        content: editContent.trim(),
        isImportant: editIsImportant,
      });

      if (response.data.success) {
        showToast('Notice updated successfully!', 'success');
        setEditingNotice(null);
        fetchNotices(); // reload
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update notice.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle Delete Click
  const handleDeleteNotice = async () => {
    setDeleting(true);
    try {
      const response = await api.delete(`/notices/${deletingId}`);
      if (response.data.success) {
        showToast('Notice deleted successfully!', 'success');
        setDeletingId(null);
        fetchNotices(); // reload
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete notice.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-brand-charcoal">
              Notice Board Management
            </h1>
            <p className="text-sm text-gray-400 font-medium">
              Create, edit, and moderate official announcements for the society residents
            </p>
          </div>

          <Link
            to="/admin/notices/new"
            className="flex items-center justify-center gap-2 py-3.5 px-5 bg-brand-primary hover:bg-brand-primary-light text-white font-bold text-sm rounded-2xl shadow-md transition-all cursor-pointer select-none shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Post New Notice
          </Link>
        </div>

        {/* Notices listing */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <CardSkeleton key={idx} />
            ))}
          </div>
        ) : notices.length === 0 ? (
          <EmptyState
            icon={<Megaphone className="w-8 h-8" />}
            title="Notice Board is empty"
            description="You haven't posted any notices yet. Create your first notice to broadcast it to residents."
            actionText="Post First Notice"
            onActionClick={() => navigate('/admin/notices/new')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className={`bg-brand-card border rounded-3xl p-6 shadow-sm flex flex-col justify-between transition-all hover:shadow-md relative overflow-hidden group ${
                  notice.isImportant
                    ? 'border-brand-warning/45 bg-amber-50/5 hover:border-brand-warning'
                    : 'border-brand-gray/40 hover:border-brand-primary/30'
                }`}
              >
                {/* Visual side highlights for important notes */}
                {notice.isImportant && (
                  <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-brand-warning" />
                )}

                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <h2 className="text-base font-extrabold text-brand-charcoal group-hover:text-brand-primary transition-colors leading-snug">
                      {notice.title}
                    </h2>
                    {notice.isImportant && (
                      <span className="flex items-center gap-1 text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200 shrink-0 select-none">
                        <Pin className="w-3 h-3 text-amber-500" />
                        Important
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 leading-relaxed font-medium whitespace-pre-wrap">
                    {notice.content}
                  </p>
                </div>

                {/* Footer and moderation controls */}
                <div className="border-t border-brand-gray/25 pt-4 mt-6 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-300" />
                    {new Date(notice.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                  </span>
                  
                  {/* Moderation CTAs */}
                  <div className="flex items-center gap-2 select-none">
                    <button
                      onClick={() => handleOpenEdit(notice)}
                      className="p-2 text-gray-400 hover:text-brand-primary hover:bg-brand-gray-light rounded-xl transition-all cursor-pointer"
                      title="Edit Notice"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingId(notice.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                      title="Delete Notice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 1. EDIT MODAL OVERLAY */}
        {editingNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-brand-charcoal/45 backdrop-blur-sm" onClick={() => setEditingNotice(null)} />
            
            <div className="relative bg-brand-card border border-brand-gray/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-fade-in space-y-6 z-10 max-h-[calc(100vh-2rem)] overflow-y-auto">
              <div className="flex justify-between items-center pb-4 border-b border-brand-gray/25">
                <h3 className="text-lg font-extrabold text-brand-charcoal">Edit Notice</h3>
                <button
                  onClick={() => setEditingNotice(null)}
                  className="p-1.5 text-gray-400 hover:bg-brand-gray-light rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notice Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-brand-ivory/50 border border-brand-gray rounded-2xl text-sm text-brand-charcoal focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Announcement Content</label>
                  <textarea
                    rows={4}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-brand-ivory/50 border border-brand-gray rounded-2xl text-sm text-brand-charcoal focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 focus:outline-none transition-all resize-none"
                  />
                </div>

                {/* Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer select-none p-1.5 bg-brand-ivory/40 rounded-xl border border-brand-gray/30 w-fit">
                  <input
                    type="checkbox"
                    checked={editIsImportant}
                    onChange={(e) => setEditIsImportant(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <span className="text-xs font-bold text-brand-charcoal flex items-center gap-1.5">
                    <Pin className="w-3.5 h-3.5 text-amber-500" />
                    Mark as Important Notice
                  </span>
                </label>

                <div className="flex gap-3 pt-4 border-t border-brand-gray/25">
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-brand-primary hover:bg-brand-primary-light text-white font-bold text-sm rounded-2xl shadow-md transition-all cursor-pointer disabled:opacity-60"
                  >
                    {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingNotice(null)}
                    className="px-6 py-3 border border-brand-gray bg-white text-gray-500 hover:text-brand-primary hover:bg-brand-gray-light font-bold text-sm rounded-2xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. DELETE CONFIRMATION MODAL OVERLAY */}
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-brand-charcoal/45 backdrop-blur-sm" onClick={() => setDeletingId(null)} />
            
            <div className="relative bg-brand-card border border-brand-gray/40 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl animate-fade-in space-y-6 z-10 text-center max-h-[calc(100vh-2rem)] overflow-y-auto">
              <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6 stroke-[2]" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-brand-charcoal">Delete Notice?</h3>
                <p className="text-xs text-gray-400 leading-relaxed font-semibold">
                  Are you sure you want to delete this notice? This action is permanent and cannot be undone.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleDeleteNotice}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-2xl shadow-md transition-all cursor-pointer disabled:opacity-60"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Delete'}
                </button>
                <button
                  onClick={() => setDeletingId(null)}
                  disabled={deleting}
                  className="px-6 py-3 border border-brand-gray bg-white text-gray-500 hover:text-brand-primary hover:bg-brand-gray-light font-bold text-sm rounded-2xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default AdminNotices;
