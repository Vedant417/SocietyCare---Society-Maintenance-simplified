import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DashboardLayout from '../layouts/DashboardLayout';
import { CardSkeleton } from '../components/SkeletonLoader';
import { Megaphone, Pin, Calendar, User as UserIcon, RotateCw } from 'lucide-react';

const NoticeBoard = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotices = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await api.get('/notices');
      if (response.data.success) {
        setNotices(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching notices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    const delay = new Promise((resolve) => setTimeout(resolve, 800));
    await Promise.all([fetchNotices(true), delay]);
    setRefreshing(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold text-brand-charcoal">
              Society Notice Board
            </h1>
            <p className="text-sm text-gray-400 font-medium">
              Stay updated with official announcements and events from society administration
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-2 border border-brand-gray bg-white hover:bg-brand-gray-light text-brand-charcoal hover:text-brand-primary font-bold text-xs rounded-2xl transition-all active:scale-95 cursor-pointer shadow-sm select-none disabled:opacity-60 shrink-0"
            title="Refresh Notice Board"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-primary' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Notices listing grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <CardSkeleton key={idx} />
            ))}
          </div>
        ) : notices.length === 0 ? (
          <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-8 text-center min-h-[300px] flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-5 shadow-sm">
              <Megaphone className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-extrabold text-brand-charcoal mb-2">Notice board is clear</h3>
            <p className="text-sm text-gray-400 max-w-sm">No notices have been posted recently. Enjoy the quiet!</p>
          </div>
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
                      <span className="flex items-center gap-1 text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200 shrink-0 select-none animate-pulse">
                        <Pin className="w-3 h-3 text-amber-500" />
                        Important
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 leading-relaxed font-medium whitespace-pre-wrap">
                    {notice.content}
                  </p>
                </div>

                {/* Footer metadata */}
                <div className="border-t border-brand-gray/25 pt-4 mt-6 flex items-center justify-between text-[10px] text-gray-400 font-bold select-none">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-300" />
                    {new Date(notice.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                  </span>
                  
                  <span className="flex items-center gap-1 uppercase tracking-wider">
                    <UserIcon className="w-3.5 h-3.5 text-gray-300" />
                    {notice.author?.role === 'ADMIN' ? 'Secretary (Admin)' : `${notice.author?.name} (${notice.author?.role})`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default NoticeBoard;
