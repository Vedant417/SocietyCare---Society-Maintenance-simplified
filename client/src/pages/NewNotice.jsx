import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { noticeSchema } from '../validations/schemas';
import DashboardLayout from '../layouts/DashboardLayout';
import { ArrowLeft, Loader2, Megaphone, Pin } from 'lucide-react';

const NewNotice = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(noticeSchema),
    defaultValues: {
      isImportant: false,
    }
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const response = await api.post('/notices', {
        title: data.title,
        content: data.content,
        isImportant: data.isImportant,
      });

      if (response.data.success) {
        showToast('Notice published successfully!', 'success');
        navigate('/admin/notices');
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to publish notice.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Back Link */}
        <Link
          to="/admin/notices"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-brand-primary transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Notices Manager
        </Link>

        {/* Content Box */}
        <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div>
            <h2 className="text-xl font-extrabold text-brand-charcoal">
              Post a Notice
            </h2>
            <p className="text-sm text-gray-400 mt-1 font-medium">
              Broadcast general announcements, schedules, or emergency alerts to all residents.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Notice Title
              </label>
              <input
                type="text"
                placeholder="e.g. Scheduled Water Outage, Pest Control..."
                {...register('title')}
                className={`block w-full px-4 py-3 bg-brand-ivory/50 border ${
                  errors.title ? 'border-brand-danger focus:ring-brand-danger/20' : 'border-brand-gray focus:ring-brand-primary/20'
                } rounded-2xl text-sm text-brand-charcoal focus:border-brand-primary focus:ring-4 focus:outline-none transition-all`}
              />
              {errors.title && (
                <p className="mt-1 text-xs font-semibold text-brand-danger">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Content */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Notice Body / Content
              </label>
              <textarea
                rows={6}
                placeholder="Write the announcement description or schedule here..."
                {...register('content')}
                className={`block w-full px-4 py-3 bg-brand-ivory/50 border ${
                  errors.content ? 'border-brand-danger focus:ring-brand-danger/20' : 'border-brand-gray focus:ring-brand-primary/20'
                } rounded-2xl text-sm text-brand-charcoal focus:border-brand-primary focus:ring-4 focus:outline-none transition-all resize-none`}
              />
              {errors.content && (
                <p className="mt-1 text-xs font-semibold text-brand-danger">
                  {errors.content.message}
                </p>
              )}
            </div>

            {/* Checkbox for Important */}
            <div className="pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none p-3.5 bg-brand-ivory/40 rounded-2xl border border-brand-gray/30 w-fit group hover:bg-brand-primary/5 hover:border-brand-primary/25 transition-all">
                <input
                  type="checkbox"
                  {...register('isImportant')}
                  className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-brand-charcoal flex items-center gap-1.5 group-hover:text-brand-primary transition-colors">
                    <Pin className="w-3.5 h-3.5 text-amber-500 stroke-[2.5]" />
                    Flag as Important notice
                  </span>
                  <span className="text-[10px] text-gray-400 font-semibold mt-0.5">
                    Will trigger email alerts to all registered residents
                  </span>
                </div>
              </label>
            </div>

            {/* Submit Actions */}
            <div className="flex gap-3 pt-4 border-t border-brand-gray/25">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-2xl shadow-md text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary-light focus:outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all cursor-pointer disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Broadcasting Notice...
                  </>
                ) : (
                  'Publish Notice'
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/notices')}
                className="px-6 py-3.5 border border-brand-gray bg-white text-gray-500 hover:text-brand-primary hover:bg-brand-gray-light font-bold text-sm rounded-2xl transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </form>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default NewNotice;
