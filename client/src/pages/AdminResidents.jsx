import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DashboardLayout from '../layouts/DashboardLayout';
import EmptyState from '../components/EmptyState';
import { TableSkeleton } from '../components/SkeletonLoader';
import { Users, Search, Mail, Phone, Home, Calendar, RotateCw } from 'lucide-react';
import Pagination from '../components/Pagination';

const AdminResidents = () => {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  const fetchResidents = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await api.get('/admin/residents');
      if (response.data.success) {
        setResidents(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching residents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResidents();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    const delay = new Promise((resolve) => setTimeout(resolve, 800));
    await Promise.all([fetchResidents(true), delay]);
    setRefreshing(false);
  };

  // Filter residents
  const filteredResidents = residents.filter((r) => {
    const query = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(query) ||
      r.email.toLowerCase().includes(query) ||
      r.phone.includes(query) ||
      r.apartmentNumber.toLowerCase().includes(query)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-brand-charcoal">
              Resident Directory
            </h1>
            <p className="text-sm text-gray-400 font-medium">
              Registered residents and apartment owners in the society database
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            {/* Search bar */}
            <div className="relative max-w-sm w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search by Name, Flat, Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-9 pr-4 py-2.5 bg-brand-card border border-brand-gray rounded-2xl text-xs text-brand-charcoal focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 focus:outline-none transition-all"
              />
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="flex items-center justify-center p-3 border border-brand-gray bg-brand-card hover:bg-brand-gray-light text-brand-charcoal hover:text-brand-primary rounded-2xl transition-all active:scale-90 cursor-pointer shadow-sm select-none disabled:opacity-60 shrink-0"
              title="Refresh Residents List"
            >
              <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-brand-primary' : ''}`} />
            </button>
          </div>
        </div>

        {/* Content list */}
        {loading ? (
          <TableSkeleton rows={6} />
        ) : filteredResidents.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title="No residents found"
            description="We couldn't find any residents matching your active search query."
          />
        ) : (
          <>
            {/* Desktop Table View */}
            {(() => {
              const totalPages = Math.ceil(filteredResidents.length / pageSize);
              const paginatedResidents = filteredResidents.slice(
                (currentPage - 1) * pageSize,
                currentPage * pageSize
              );

              return (
                <>
                  <div className="hidden md:block bg-brand-card border border-brand-gray/40 rounded-3xl overflow-hidden shadow-sm">
                    <table className="min-w-full divide-y divide-brand-gray/30">
                      <thead className="bg-brand-gray-light/35 select-none">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Resident Name</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Gender</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Age</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Apartment/Flat</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Phone Number</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Members</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Complaints Raised</th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Registered</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-gray/25">
                        {paginatedResidents.map((r) => (
                    <tr key={r.id} className="hover:bg-brand-gray-light/10 transition-colors">
                      <td className="px-6 py-4.5 whitespace-nowrap text-xs font-extrabold text-brand-charcoal flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center font-bold text-brand-primary uppercase shrink-0">
                          {r.name.charAt(0)}
                        </div>
                        {r.name}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-center text-xs text-gray-500 font-medium">
                        {r.gender ? (r.gender.charAt(0) + r.gender.slice(1).toLowerCase()) : <span className="text-gray-400 text-[10px] font-bold">N/A</span>}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-center text-xs text-gray-500 font-medium">
                        {r.dateOfBirth ? (() => {
                          const birth = new Date(r.dateOfBirth);
                          const now = new Date();
                          let age = now.getFullYear() - birth.getFullYear();
                          const m = now.getMonth() - birth.getMonth();
                          if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
                          return age + ' yrs';
                        })() : <span className="text-gray-400 text-[10px] font-bold">N/A</span>}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-center text-xs font-bold text-gray-500">
                        Flat {r.apartmentNumber}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-xs text-gray-500 font-medium">
                        {r.email}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-xs text-gray-500 font-medium">
                        {r.phone}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-center text-xs font-extrabold text-emerald-600">
                        <span className="bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                          {r._count?.familyMembers || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-center text-xs font-extrabold text-brand-primary">
                        <span className="bg-brand-primary/5 px-2.5 py-0.5 rounded-full border border-brand-primary/10">
                          {r._count?.complaints || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-right text-xs text-gray-400 font-semibold">
                        {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-4">
              {paginatedResidents.map((r) => (
                <div
                  key={r.id}
                  className="bg-brand-card border border-brand-gray/40 rounded-3xl p-5 hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center font-bold text-brand-primary text-base uppercase shrink-0">
                      {r.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-brand-charcoal truncate">{r.name}</h3>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                        Flat {r.apartmentNumber}
                      </span>
                    </div>
                  </div>

                    <div className="space-y-2 border-t border-brand-gray/25 pt-3">
                      <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                        <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="truncate">{r.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                        <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{r.phone}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap text-[10px] font-bold pt-1">
                        {r.gender && (
                          <span className="px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                            {r.gender.charAt(0) + r.gender.slice(1).toLowerCase()}
                          </span>
                        )}
                        {r.dateOfBirth && (() => {
                          const birth = new Date(r.dateOfBirth);
                          const now = new Date();
                          let age = now.getFullYear() - birth.getFullYear();
                          const m = now.getMonth() - birth.getMonth();
                          if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
                          return <span className="text-gray-400">Age {age}</span>;
                        })()}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold select-none pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-300" />
                          Joined {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-600">{r._count?.familyMembers || 0} Family</span>
                          <span>{r._count?.complaints || 0} Tickets</span>
                        </div>
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
                );
              })()}
          </>
        )}

      </div>
    </DashboardLayout>
  );
};

export default AdminResidents;
