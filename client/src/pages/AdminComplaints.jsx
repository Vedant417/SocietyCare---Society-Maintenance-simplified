import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import DashboardLayout from '../layouts/DashboardLayout';
import EmptyState from '../components/EmptyState';
import { TableSkeleton } from '../components/SkeletonLoader';
import {
  Search,
  Wrench,
  AlertTriangle,
  ArrowUpRight,
  SlidersHorizontal,
  X,
  Clock,
  RotateCw
} from 'lucide-react';
import Pagination from '../components/Pagination';

const AdminComplaints = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters state from query parameters or default
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [overdueFilter, setOverdueFilter] = useState(searchParams.get('overdue') === 'true');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, statusFilter, priorityFilter, overdueFilter, searchQuery, pageSize]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const delay = new Promise((resolve) => setTimeout(resolve, 800));
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.append('category', categoryFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (overdueFilter) params.append('overdue', 'true');
      if (searchQuery) params.append('search', searchQuery);

      const [response] = await Promise.all([
        api.get(`/complaints?${params.toString()}`),
        delay
      ]);
      if (response.data.success) {
        setComplaints(response.data.data);
      }
    } catch (error) {
      console.error('Error refreshing admin complaints:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Sync params if they change externally (e.g. clicking dashboard widgets)
  useEffect(() => {
    setStatusFilter(searchParams.get('status') || '');
    setOverdueFilter(searchParams.get('overdue') === 'true');
  }, [searchParams]);

  useEffect(() => {
    const fetchComplaints = async () => {
      setLoading(true);
      try {
        // Build query string
        const params = new URLSearchParams();
        if (categoryFilter) params.append('category', categoryFilter);
        if (statusFilter) params.append('status', statusFilter);
        if (priorityFilter) params.append('priority', priorityFilter);
        if (overdueFilter) params.append('overdue', 'true');
        if (searchQuery) params.append('search', searchQuery);

        const response = await api.get(`/complaints?${params.toString()}`);
        if (response.data.success) {
          setComplaints(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching admin complaints:', error);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchComplaints();
    }, 300); // Debounce API calls for search

    return () => clearTimeout(delayDebounce);
  }, [categoryFilter, statusFilter, priorityFilter, overdueFilter, searchQuery]);

  const handleClearFilters = () => {
    setCategoryFilter('');
    setStatusFilter('');
    setPriorityFilter('');
    setOverdueFilter(false);
    setSearchQuery('');
    setSearchParams({});
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

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold text-brand-charcoal">
              Maintenance Complaint Center
            </h1>
            <p className="text-sm text-gray-400 font-medium">
              Manage, escalate, and resolve resident-reported maintenance issues
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-2 border border-brand-gray bg-white hover:bg-brand-gray-light text-brand-charcoal hover:text-brand-primary font-bold text-xs rounded-2xl transition-all active:scale-95 cursor-pointer shadow-sm select-none disabled:opacity-60 shrink-0"
            title="Refresh Complaints Data"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-primary' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Filters and Inputs Card */}
        <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-6 shadow-sm space-y-4">

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search by Complaint number, resident name, flat number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-9 pr-4 py-2.5 bg-brand-ivory/50 border border-brand-gray rounded-2xl text-xs text-brand-charcoal focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 focus:outline-none transition-all"
              />
            </div>

            {/* Overdue checkbox */}
            <button
              onClick={() => {
                const newVal = !overdueFilter;
                setOverdueFilter(newVal);
                if (newVal) searchParams.set('overdue', 'true');
                else searchParams.delete('overdue');
                setSearchParams(searchParams);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer select-none shrink-0 ${overdueFilter
                ? 'bg-red-50 border-red-200 text-red-600 shadow-sm animate-pulse'
                : 'bg-brand-ivory/30 border-brand-gray text-gray-500 hover:text-red-500'
                }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Overdue Only
            </button>
          </div>

          {/* Core filters row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-brand-gray/20">
            <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[280px]">

              <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold shrink-0">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters:
              </div>

              {/* Status */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  if (e.target.value) searchParams.set('status', e.target.value);
                  else searchParams.delete('status');
                  setSearchParams(searchParams);
                }}
                className="px-3 py-1.5 bg-brand-ivory/50 border border-brand-gray rounded-xl text-xs text-brand-charcoal font-semibold cursor-pointer outline-none focus:border-brand-primary"
              >
                <option value="">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>

              {/* Priority */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-1.5 bg-brand-ivory/50 border border-brand-gray rounded-xl text-xs text-brand-charcoal font-semibold cursor-pointer outline-none focus:border-brand-primary"
              >
                <option value="">All Priorities</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              {/* Category */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-brand-ivory/50 border border-brand-gray rounded-xl text-xs text-brand-charcoal font-semibold cursor-pointer outline-none focus:border-brand-primary"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Clear filters CTA */}
            {(categoryFilter || statusFilter || priorityFilter || overdueFilter || searchQuery) && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 transition-colors p-1.5 cursor-pointer bg-red-50/50 hover:bg-red-50 rounded-xl"
              >
                <X className="w-3.5 h-3.5" />
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Content list */}
        {loading ? (
          <TableSkeleton rows={8} />
        ) : complaints.length === 0 ? (
          <EmptyState
            icon={<Wrench className="w-8 h-8" />}
            title="No complaints match filters"
            description="Looks like there are no active complaints matching your select filters. Reset parameters to load all tickets."
            actionText="Clear Active Filters"
            onActionClick={handleClearFilters}
          />
        ) : (
          <>
            {/* Desktop Table */}
            {(() => {
              const totalPages = Math.ceil(complaints.length / pageSize);
              const paginatedComplaints = complaints.slice(
                (currentPage - 1) * pageSize,
                currentPage * pageSize
              );

              return (
                <>
                  <div className="hidden lg:block bg-brand-card border border-brand-gray/40 rounded-3xl overflow-hidden shadow-sm">
                    <table className="min-w-full divide-y divide-brand-gray/30">
                      <thead className="bg-brand-gray-light/35 select-none">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">ID</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Resident</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Apartment</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Category</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Priority</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Created</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider w-[120px]">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-gray/25">
                        {paginatedComplaints.map((c) => (
                          <tr
                            key={c.id}
                            onClick={() => navigate(`/admin/complaints/${c.id}`)}
                            className={`hover:bg-brand-gray-light/10 transition-colors cursor-pointer group ${c.isOverdue ? 'bg-red-50/5' : ''
                              }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-xs font-extrabold text-brand-primary">
                              <div className="flex items-center gap-2">
                                #NF-{c.complaintNumber}
                                {c.isOverdue && (
                                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" title="Overdue!" />
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-brand-charcoal">
                              {c.resident?.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-500">
                              Flat {c.resident?.apartmentNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-brand-charcoal">
                              {c.category}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase border ${getPriorityColor(c.priority)}`}>
                                {c.priority}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase border ${getStatusColor(c.status)}`}>
                                {c.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-semibold">
                              {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center w-[120px]">
                              <div className="flex items-center justify-center">
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-primary select-none group-hover:underline">
                                  Manage
                                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden space-y-4">
                    {paginatedComplaints.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => navigate(`/admin/complaints/${c.id}`)}
                        className={`bg-brand-card border rounded-3xl p-5 hover:shadow-md transition-all cursor-pointer space-y-3.5 group ${c.isOverdue ? 'border-red-200 bg-red-50/5' : 'border-brand-gray/40'
                          }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-brand-primary bg-brand-primary/5 px-2.5 py-0.5 rounded-full border border-brand-primary/10">
                              #NF-{c.complaintNumber}
                            </span>
                            {c.isOverdue && (
                              <span className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-extrabold rounded-full bg-red-50 text-red-600 border border-red-100 uppercase animate-pulse select-none">
                                Overdue
                              </span>
                            )}
                          </div>

                          <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Flat {c.resident?.apartmentNumber} &bull; {c.resident?.name}
                          </p>
                          <p className="text-sm font-bold text-brand-charcoal line-clamp-2 leading-relaxed group-hover:text-brand-primary transition-colors">
                            {c.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-brand-gray/25">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border ${getPriorityColor(c.priority)}`}>
                            {c.priority}
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border ${getStatusColor(c.status)}`}>
                            {c.status.replace('_', ' ')}
                          </span>
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
              );
            })()}
          </>
        )}

      </div>
    </DashboardLayout>
  );
};

export default AdminComplaints;
