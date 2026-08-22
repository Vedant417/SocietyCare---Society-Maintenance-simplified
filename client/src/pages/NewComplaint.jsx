import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { complaintSchema } from '../validations/schemas';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../services/api';
import {
  Camera,
  X,
  Loader2,
  CheckCircle,
  ArrowLeft,
  FileImage,
  UploadCloud,
  Copy,
  AlertCircle,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

const NewComplaint = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successComplaint, setSuccessComplaint] = useState(null);

  // --- Feature 1: Duplicate Detection ---
  const [duplicateMatches, setDuplicateMatches] = useState([]);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [duplicateDismissed, setDuplicateDismissed] = useState(false);
  const duplicateTimerRef = useRef(null);

  const categories = [
    'Plumbing',
    'Electrical',
    'Cleaning',
    'Security',
    'Lift / Elevator',
    'Parking',
    'Water',
    'Maintenance',
    'Other',
  ];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(complaintSchema),
  });

  const watchedCategory = watch('category');
  const watchedDescription = watch('description');

  // Debounced duplicate check
  useEffect(() => {
    if (!watchedCategory || !watchedDescription || watchedDescription.length < 20 || duplicateDismissed) {
      setDuplicateMatches([]);
      return;
    }

    if (duplicateTimerRef.current) clearTimeout(duplicateTimerRef.current);

    duplicateTimerRef.current = setTimeout(async () => {
      setCheckingDuplicate(true);
      try {
        const response = await api.post('/complaints/check-duplicate', {
          category: watchedCategory,
          description: watchedDescription,
        });
        if (response.data.success && response.data.data.hasDuplicate) {
          setDuplicateMatches(response.data.data.matches);
        } else {
          setDuplicateMatches([]);
        }
      } catch {
        // silently fail — never block submission
        setDuplicateMatches([]);
      } finally {
        setCheckingDuplicate(false);
      }
    }, 800);

    return () => { if (duplicateTimerRef.current) clearTimeout(duplicateTimerRef.current); };
  }, [watchedCategory, watchedDescription, duplicateDismissed]);

  // Handle image select & validation
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Invalid file type. Only JPG, PNG, and WebP images are allowed.', 'error');
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('File size is too large. Maximum size allowed is 5MB.', 'error');
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN': return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase">Open</span>;
      case 'IN_PROGRESS': return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 text-amber-600 border border-amber-100 uppercase">In Progress</span>;
      case 'RESOLVED': return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase">Resolved</span>;
      default: return null;
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      // Use multipart/form-data for image uploads
      const formData = new FormData();
      formData.append('category', data.category);
      formData.append('description', data.description);
      formData.append('priority', data.priority);
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const response = await api.post('/complaints', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setSuccessComplaint(response.data.data);
        showToast('Complaint submitted successfully!', 'success');
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to submit complaint.';
      showToast(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Back Link */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-brand-primary transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Overview
        </Link>

        {successComplaint ? (
          /* SUCCESS STATE */
          <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-8 text-center space-y-6 shadow-sm animate-fade-in py-12">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-brand-success flex items-center justify-center mx-auto border border-emerald-100 shadow-sm animate-pulse">
              <CheckCircle className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-brand-charcoal">
                Complaint Registered!
              </h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                Your complaint has been logged and assigned ticket ID{' '}
                <strong className="text-brand-primary font-bold">
                  #NF-{successComplaint.complaintNumber}
                </strong>
                . A notification has been sent to the maintenance office.
              </p>
            </div>

            <div className="border border-brand-gray/40 rounded-2xl p-4 bg-brand-ivory/40 max-w-sm mx-auto text-left text-xs space-y-2.5">
              <div className="flex justify-between font-semibold"><span className="text-gray-400">Category:</span> <span className="text-brand-charcoal">{successComplaint.category}</span></div>
              <div className="flex justify-between font-semibold"><span className="text-gray-400">Priority:</span> <span className="text-amber-600 font-bold uppercase">{successComplaint.priority}</span></div>
              <div className="flex justify-between font-semibold"><span className="text-gray-400">Status:</span> <span className="text-indigo-600 font-bold uppercase">{successComplaint.status}</span></div>
              <div className="flex justify-between font-semibold"><span className="text-gray-400">Flat/Apartment:</span> <span className="text-brand-charcoal">{user?.apartmentNumber}</span></div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                onClick={() => navigate(`/complaints/${successComplaint.id}`)}
                className="w-full sm:w-auto px-6 py-3.5 bg-brand-primary hover:bg-brand-primary-light text-white font-bold text-sm rounded-2xl shadow-md transition-all cursor-pointer"
              >
                Track Complaint Timeline
              </button>
              <button
                onClick={() => {
                  setSuccessComplaint(null);
                  handleRemovePhoto();
                  setDuplicateMatches([]);
                  setDuplicateDismissed(false);
                }}
                className="w-full sm:w-auto px-6 py-3.5 border border-brand-gray bg-white text-gray-500 hover:text-brand-primary hover:bg-brand-gray-light font-bold text-sm rounded-2xl transition-all cursor-pointer"
              >
                Raise Another Issue
              </button>
            </div>
          </div>
        ) : (
          /* FORM STATE */
          <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-brand-charcoal">
                Raise a Complaint
              </h2>
              <p className="text-sm text-gray-400 mt-1 font-medium">
                Submit details regarding any maintenance issues inside or around your apartment.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

              {/* Info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Resident info auto */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Resident Name
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user?.name || ''}
                    className="block w-full px-4 py-3 bg-brand-gray-light/50 border border-brand-gray rounded-2xl text-sm text-gray-400 cursor-not-allowed font-medium"
                  />
                </div>
                {/* Apartment info auto */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Apartment / Flat Number
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user?.apartmentNumber || ''}
                    className="block w-full px-4 py-3 bg-brand-gray-light/50 border border-brand-gray rounded-2xl text-sm text-gray-400 cursor-not-allowed font-medium"
                  />
                </div>
              </div>

              {/* Category & Priority Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category dropdown */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Complaint Category
                  </label>
                  <div className="relative">
                    <select
                      {...register('category')}
                      className={`appearance-none block w-full px-4 pr-12 py-3 bg-brand-ivory/50 border ${errors.category
                          ? 'border-brand-danger focus:ring-brand-danger/20'
                          : 'border-brand-gray focus:ring-brand-primary/20'
                        } rounded-2xl text-sm text-brand-charcoal focus:border-brand-primary focus:ring-4 focus:outline-none transition-all cursor-pointer`}
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal" />
                  </div>
                  {errors.category && (
                    <p className="mt-1.5 text-xs font-semibold text-brand-danger">
                      {errors.category.message}
                    </p>
                  )}
                </div>

                {/* Priority dropdown */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Urgency / Priority
                  </label>
                  <div className="relative">
                    <select
                      {...register('priority')}
                      className={`appearance-none block w-full px-4 pr-12 py-3 bg-brand-ivory/50 border ${errors.priority
                          ? 'border-brand-danger focus:ring-brand-danger/20'
                          : 'border-brand-gray focus:ring-brand-primary/20'
                        } rounded-2xl text-sm text-brand-charcoal focus:border-brand-primary focus:ring-4 focus:outline-none transition-all cursor-pointer`}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal" />
                  </div>
                  {errors.priority && (
                    <p className="mt-1.5 text-xs font-semibold text-brand-danger">
                      {errors.priority.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Detailed Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide details about the problem (e.g., location, frequency, or severity)..."
                  {...register('description')}
                  className={`block w-full px-4 py-3 bg-brand-ivory/50 border ${errors.description ? 'border-brand-danger focus:ring-brand-danger/20' : 'border-brand-gray focus:ring-brand-primary/20'
                    } rounded-2xl text-sm text-brand-charcoal focus:border-brand-primary focus:ring-4 focus:outline-none transition-all resize-none`}
                />
                {errors.description && (
                  <p className="mt-1 text-xs font-semibold text-brand-danger">
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* --- Feature 1: Duplicate Detection Banner --- */}
              {checkingDuplicate && (
                <div className="flex items-center gap-2 px-4 py-2 bg-brand-ivory/60 border border-brand-gray/40 rounded-2xl">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                  <span className="text-xs text-gray-400 font-semibold">Checking for similar complaints...</span>
                </div>
              )}

              {!checkingDuplicate && duplicateMatches.length > 0 && !duplicateDismissed && (
                <div className="border border-amber-200 bg-amber-50/60 rounded-2xl p-4 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Copy className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="text-xs font-extrabold text-amber-700 uppercase tracking-wider">
                        Similar complaint found
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDuplicateDismissed(true)}
                      className="text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {duplicateMatches.map((match) => (
                      <div key={match.id} className="bg-white border border-amber-100 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs font-extrabold text-brand-primary">
                            #NF-{match.complaintNumber}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {getStatusBadge(match.status)}
                            <span className="text-[10px] text-gray-400 font-semibold">
                              {new Date(match.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 font-medium">
                          {match.description}
                        </p>
                        {match.resident && (
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            Flat {match.resident.apartmentNumber} · {match.confidence}% similar
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-amber-700/80 font-medium leading-relaxed">
                    A similar complaint may already exist. You can view it or submit your complaint anyway — it will never be automatically rejected.
                  </p>

                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => navigate(`/complaints/${duplicateMatches[0].id}`)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Existing
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuplicateDismissed(true)}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Submit Anyway
                    </button>
                  </div>
                </div>
              )}

              {/* Photo upload field */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Attach Photo (Optional)
                </label>

                {photoPreview ? (
                  /* IMAGE PREVIEW SCREEN */
                  <div className="relative border border-brand-gray/50 rounded-2xl overflow-hidden aspect-video bg-black/5 flex items-center justify-center max-h-[300px]">
                    <img
                      src={photoPreview}
                      alt="Complaint preview"
                      className="h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  /* DRAG DROP ZONE */
                  <label className="border-2 border-dashed border-brand-gray hover:border-brand-primary/50 bg-brand-ivory/30 hover:bg-brand-primary/5 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all gap-2 group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-brand-primary transition-colors" />
                    <span className="text-xs font-bold text-brand-charcoal group-hover:text-brand-primary transition-colors">
                      Click to upload image
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold">
                      Support PNG, JPG, JPEG, WebP up to 5MB
                    </span>
                  </label>
                )}
              </div>

              {/* Submit CTA */}
              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-2xl shadow-md text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary-light focus:outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all cursor-pointer disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Registering ticket...
                    </>
                  ) : (
                    'Submit Complaint'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3.5 border border-brand-gray bg-white text-gray-500 hover:text-brand-primary hover:bg-brand-gray-light font-bold text-sm rounded-2xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default NewComplaint;
