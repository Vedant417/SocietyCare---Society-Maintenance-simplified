import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import DashboardLayout from '../layouts/DashboardLayout';
import EmptyState from '../components/EmptyState';
import { TableSkeleton } from '../components/SkeletonLoader';
import {
  Wrench,
  Plus,
  ArrowUpRight,
  Search,
  Clock,
  RotateCw,
  AlertTriangle,
  Loader2,
  Eye,
  Pencil,
  Trash2,
  X,
  ChevronDown
} from 'lucide-react';
import Pagination from '../components/Pagination';

const ResidentComplaints = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const statusParam = queryParams.get('status');

  // Status filter state: 'ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'
  const [activeTab, setActiveTab] = useState(
    statusParam && ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(statusParam.toUpperCase())
      ? statusParam.toUpperCase()
      : 'ALL'
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const s = params.get('status');
    if (s && ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(s.toUpperCase())) {
      setActiveTab(s.toUpperCase());
    }
  }, [location.search]);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, pageSize]);

  // Delete Confirm States
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Edit states
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

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

  const handleOpenEdit = (complaint) => {
    setEditingComplaint(complaint);
    setEditCategory(complaint.category);
    setEditDescription(complaint.description);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editCategory || !editDescription.trim()) {
      showToast('Category and Description are required.', 'warning');
      return;
    }
    setSavingEdit(true);
    try {
      const response = await api.patch(`/complaints/${editingComplaint.id}`, {
        category: editCategory,
        description: editDescription.trim(),
      });
      if (response.data.success) {
        showToast('Complaint updated successfully!', 'success');
        setEditingComplaint(null);
        fetchComplaints(); // reload
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update complaint.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteComplaint = async () => {
    setDeleting(true);
    try {
      const response = await api.delete(`/complaints/${deletingId}`);
      if (response.data.success) {
        showToast('Complaint deleted successfully.', 'success');
        setDeletingId(null);
        fetchComplaints(); // reload
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete complaint.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const fetchComplaints = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await api.get('/complaints');
      if (response.data.success) {
        setComplaints(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  // Lock body scroll when editing or deleting modals are active
  useEffect(() => {
    if (editingComplaint || deletingId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [editingComplaint, deletingId]);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    const delay = new Promise((resolve) => setTimeout(resolve, 800));
    await Promise.all([fetchComplaints(true), delay]);
    setRefreshing(false);
  };

  // Filter complaints
  const filteredComplaints = complaints.filter((c) => {
    const matchesTab = activeTab === 'ALL' || c.status === activeTab;
    const matchesSearch =
      searchQuery.trim() === '' ||
      c.complaintNumber.toString().includes(searchQuery) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const totalPages = Math.ceil(filteredComplaints.length / pageSize);
  const paginatedComplaints = filteredComplaints.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase select-none">Open</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-600 border border-amber-100 uppercase select-none">In Progress</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase select-none">Resolved</span>;
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'HIGH':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-50 text-red-600 border border-red-100 uppercase select-none">High</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 text-amber-600 border border-amber-100 uppercase select-none">Medium</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-50 text-gray-500 border border-gray-200 uppercase select-none">Low</span>;
      default:
        return null;
    }
  };

  const tabs = [
    { label: 'All', value: 'ALL' },
    { label: 'Open', value: 'OPEN' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Resolved', value: 'RESOLVED' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-brand-charcoal">
              My Complaints
            </h1>
            <p className="text-sm text-gray-400 font-medium">
              View and track all maintenance requests for your apartment
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="flex items-center justify-center p-3 border border-brand-gray bg-brand-card hover:bg-brand-gray-light text-brand-charcoal hover:text-brand-primary rounded-2xl transition-all active:scale-90 cursor-pointer shadow-sm select-none disabled:opacity-60 shrink-0"
              title="Refresh Complaints List"
            >
              <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-brand-primary' : ''}`} />
            </button>

            <Link
              to="/complaints/new"
              className="flex items-center justify-center gap-2 py-3 px-5 bg-brand-primary hover:bg-brand-primary-light text-white font-bold text-sm rounded-2xl shadow-md shadow-brand-primary/10 hover:shadow-lg transition-all transform active:scale-98 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Raise Complaint
            </Link>
          </div>
        </div>

        {/* Filters and Tabs */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-brand-card p-4 border border-brand-gray/40 rounded-3xl shadow-sm">
          {/* Tabs */}
          <div className="flex flex-wrap gap-1.5 bg-brand-ivory/60 p-1.5 rounded-2xl border border-brand-gray/30 w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === tab.value
                    ? 'bg-brand-card text-brand-primary shadow-sm'
                    : 'text-gray-400 hover:text-brand-primary'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search by ID, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-9 pr-4 py-2.5 bg-brand-ivory/50 border border-brand-gray rounded-2xl text-xs text-brand-charcoal focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Content list */}
        {loading ? (
          <TableSkeleton rows={6} />
        ) : filteredComplaints.length === 0 ? (
          <EmptyState
            icon={<Wrench className="w-8 h-8" />}
            title="No complaints found"
            description={
              searchQuery || activeTab !== 'ALL'
                ? "We couldn't find any complaints matching your active filters."
                : "You haven't submitted any complaints yet. Everything looks in order!"
            }
            actionText={searchQuery || activeTab !== 'ALL' ? null : "Raise your first complaint"}
            onActionClick={() => navigate('/complaints/new')}
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-brand-card border border-brand-gray/40 rounded-3xl overflow-hidden shadow-sm">
              <table className="min-w-full divide-y divide-brand-gray/30">
                <thead className="bg-brand-gray-light/35 select-none">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Complaint ID</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Raised Date</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider w-[150px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-gray/25">
                  {paginatedComplaints.map((complaint) => (
                    <tr
                      key={complaint.id}
                      onClick={() => navigate(`/complaints/${complaint.id}`)}
                      className="hover:bg-brand-gray-light/10 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4.5 whitespace-nowrap text-xs font-extrabold text-brand-primary">
                        #NF-{complaint.complaintNumber}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-xs font-bold text-brand-charcoal">
                        {complaint.category}
                      </td>
                      <td className="px-6 py-4.5 text-xs text-gray-500 max-w-xs truncate font-medium">
                        {complaint.description}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        {getPriorityBadge(complaint.priority)}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        {getStatusBadge(complaint.status)}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-xs text-gray-400 font-semibold">
                        {new Date(complaint.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-right text-xs font-bold space-x-2.5 select-none">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/complaints/${complaint.id}`);
                          }}
                          className="p-1.5 text-brand-primary hover:bg-[#EEF2F7] rounded-xl transition-all cursor-pointer border-0 bg-transparent inline-flex"
                          title="View complaint"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(complaint);
                          }}
                          className="p-1.5 text-brand-primary hover:bg-[#EEF2F7] rounded-xl transition-all cursor-pointer border-0 bg-transparent inline-flex"
                          title="Edit complaint"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingId(complaint.id);
                          }}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all cursor-pointer border-0 bg-transparent inline-flex"
                          title="Delete complaint"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-4">
              {paginatedComplaints.map((complaint) => (
                <div
                  key={complaint.id}
                  onClick={() => navigate(`/complaints/${complaint.id}`)}
                  className="bg-brand-card border border-brand-gray/40 rounded-3xl p-5 hover:shadow-md transition-all cursor-pointer space-y-3.5 group"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-brand-primary bg-brand-primary/5 px-2.5 py-0.5 rounded-full border border-brand-primary/10">
                      #NF-{complaint.complaintNumber}
                    </span>
                    <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(complaint.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{complaint.category}</p>
                    <p className="text-sm font-bold text-brand-charcoal line-clamp-2 leading-relaxed group-hover:text-brand-primary transition-colors">
                      {complaint.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-brand-gray/25 select-none">
                    <div className="flex gap-2">
                      {getPriorityBadge(complaint.priority)}
                      {getStatusBadge(complaint.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/complaints/${complaint.id}`);
                        }}
                        className="p-1 text-brand-primary hover:bg-[#EEF2F7] rounded-lg transition-all cursor-pointer border-0 bg-transparent inline-flex"
                        title="View complaint"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(complaint);
                        }}
                        className="p-1 text-brand-primary hover:bg-[#EEF2F7] rounded-lg transition-all cursor-pointer border-0 bg-transparent inline-flex"
                        title="Edit complaint"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(complaint.id);
                        }}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all cursor-pointer border-0 bg-transparent inline-flex"
                        title="Delete complaint"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}

      </div>

      {/* EDIT COMPLAINT MODAL OVERLAY */}
      {editingComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-brand-charcoal/45 backdrop-blur-sm" onClick={() => setEditingComplaint(null)} />

          <div className="relative bg-brand-card border border-brand-gray/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-fade-in space-y-6 z-10 max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-brand-gray/25">
              <h3 className="text-lg font-extrabold text-brand-charcoal">Edit Complaint</h3>
              <button
                onClick={() => setEditingComplaint(null)}
                className="p-1.5 text-gray-400 hover:bg-brand-gray-light rounded-xl transition-colors cursor-pointer border-0 bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Complaint Category</label>
                <div className="relative">
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="appearance-none block w-full px-4 pr-12 py-2.5 bg-brand-ivory/50 border border-brand-gray rounded-2xl text-sm text-brand-charcoal focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 focus:outline-none transition-all outline-none cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Detailed Description</label>
                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-brand-ivory/50 border border-brand-gray rounded-2xl text-sm text-brand-charcoal focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 focus:outline-none transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-brand-gray/25">
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-brand-primary hover:bg-brand-primary-light text-white font-bold text-sm rounded-2xl shadow-md transition-all cursor-pointer disabled:opacity-60 font-bold"
                >
                  {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingComplaint(null)}
                  className="px-6 py-3 border border-brand-gray bg-white text-gray-500 hover:text-brand-primary hover:bg-brand-gray-light font-bold text-sm rounded-2xl transition-all cursor-pointer font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL OVERLAY */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-brand-charcoal/45 backdrop-blur-sm" onClick={() => setDeletingId(null)} />

          <div className="relative bg-brand-card border border-brand-gray/40 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl animate-fade-in space-y-6 z-10 text-center max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 stroke-[2]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-brand-charcoal">Delete Complaint?</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-semibold">
                Are you sure you want to delete this complaint? This action is permanent and cannot be undone.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleDeleteComplaint}
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

    </DashboardLayout>
  );
};

export default ResidentComplaints;
