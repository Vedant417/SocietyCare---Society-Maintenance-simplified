import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNotifications } from '../context/NotificationContext';
import {
  LayoutDashboard,
  Wrench,
  PlusCircle,
  Megaphone,
  User as UserIcon,
  Users,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  Bell,
  AlertTriangle,
  Search,
  Calendar,
  PhoneCall,
  Activity
} from 'lucide-react';
import { getPhotoUrl } from '../services/api';

const DashboardLayout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const {
    notifications,
    unreadCount,
    markAsRead,
    deleteNotification,
    markAllAsRead
  } = useNotifications();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const notifDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const [liveDateTime, setLiveDateTime] = useState('');

  // Live dynamic clock updater
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const day = now.getDate();
      const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      const month = monthNames[now.getMonth()];
      const year = now.getFullYear();

      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const timeStr = `${hours}:${minutes} ${ampm}`;

      setLiveDateTime(`${day} ${month} ${year} • ${timeStr}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close dropdowns when clicking anywhere outside their containers
  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setNotificationDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  // Re-evaluate relative time strings dynamically every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await logout();
    showToast('Logged out successfully.', 'info');
    navigate('/login');
  };

  const renderSidebarAvatar = () => {
    if (user?.profilePhotoUrl) {
      return (
        <img
          src={getPhotoUrl(user.profilePhotoUrl)}
          alt="Avatar"
          className="w-10 h-10 rounded-full object-cover border border-[#635BFF]/20 shrink-0"
        />
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center font-bold text-sm border border-[#635BFF]/20 uppercase shrink-0">
        {user?.name?.charAt(0)}
      </div>
    );
  };

  const renderHeaderAvatar = () => {
    if (user?.profilePhotoUrl) {
      return (
        <img
          src={getPhotoUrl(user.profilePhotoUrl)}
          alt=""
          className="w-8 h-8 rounded-full object-cover border border-brand-primary/10"
        />
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center font-bold text-brand-primary text-xs uppercase">
        {user?.name?.charAt(0)}
      </div>
    );
  };

  const renderDrawerAvatar = () => {
    if (user?.profilePhotoUrl) {
      return (
        <img
          src={getPhotoUrl(user.profilePhotoUrl)}
          alt=""
          className="w-10 h-10 rounded-full object-cover border border-brand-primary/25 shrink-0"
        />
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center font-bold text-brand-primary uppercase">
        {user?.name?.charAt(0)}
      </div>
    );
  };

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'COMPLAINT_RAISED':
        return <PlusCircle className="w-4 h-4 text-brand-primary" />;
      case 'STATUS_UPDATED':
        return <Wrench className="w-4 h-4 text-indigo-500" />;
      case 'PRIORITY_CHANGED':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'NOTICE_POSTED':
        return <Megaphone className="w-4 h-4 text-emerald-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleNotificationClick = async (notif) => {
    setNotificationDropdownOpen(false);
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }

    const targetId = notif.complaint?.id ||
      (typeof notif.complaintId === 'object' && notif.complaintId
        ? notif.complaintId.id || notif.complaintId._id || notif.complaintId.toString()
        : notif.complaintId);

    if (targetId) {
      if (isAdmin) {
        navigate(`/admin/complaints/${targetId}`);
      } else {
        navigate(`/complaints/${targetId}`);
      }
    } else {
      if (isAdmin) {
        navigate('/admin/notices');
      } else {
        navigate('/notices');
      }
    }
  };

  // Define navigation items based on Role
  const residentNav = [
    { label: 'Overview', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'My Complaints', path: '/complaints', icon: <Wrench className="w-5 h-5" /> },
    { label: 'Raise Complaint', path: '/complaints/new', icon: <PlusCircle className="w-5 h-5" /> },
    { label: 'Notice Board', path: '/notices', icon: <Megaphone className="w-5 h-5" /> },
    { label: 'Emergency', path: '/emergency', icon: <PhoneCall className="w-5 h-5" /> },
    { label: 'Profile', path: '/profile', icon: <UserIcon className="w-5 h-5" /> },
  ];

  const adminNav = [
    { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Complaints', path: '/admin/complaints', icon: <Wrench className="w-5 h-5" /> },
    { label: 'Notice Board', path: '/admin/notices', icon: <Megaphone className="w-5 h-5" /> },
    { label: 'Residents', path: '/admin/residents', icon: <Users className="w-5 h-5" /> },
    { label: 'Society Pulse', path: '/admin/society-pulse', icon: <Activity className="w-5 h-5" /> },
    { label: 'Settings', path: '/admin/settings', icon: <SettingsIcon className="w-5 h-5" /> },
  ];

  const navItems = isAdmin ? adminNav : residentNav;

  // Greeting helper based on local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const currentPath = location.pathname;

  const isNavItemActive = (item) => {
    // Raise Complaint must only be active on /complaints/new
    if (item.path === '/complaints/new') {
      return currentPath === '/complaints/new';
    }

    // My Complaints should be active on /complaints and complaint detail pages,
    // but NOT on /complaints/new
    if (item.path === '/complaints') {
      return (
        currentPath === '/complaints' ||
        (currentPath.startsWith('/complaints/') &&
          currentPath !== '/complaints/new')
      );
    }

    // Admin complaint pages
    if (item.path === '/admin/complaints') {
      return (
        currentPath === '/admin/complaints' ||
        (currentPath.startsWith('/admin/complaints/') &&
          currentPath !== '/admin/complaints/new')
      );
    }

    return currentPath === item.path;
  };

  return (
    <div className="min-h-screen bg-brand-ivory flex">

      {/* 1. Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#FDFBF7] border-r border-brand-gray/40 shrink-0 sticky top-0 h-screen shadow-sm">
        {/* Brand Header */}
        <div className="p-6 border-b border-brand-gray/40 flex flex-col">
          <Link to={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-brand-primary tracking-tight">SocietyCare</span>
          </Link>
          <span className="text-[10px] text-text-muted mt-1 font-bold uppercase tracking-wider">Society Maintenance simplified</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = isNavItemActive(item);

            // Customized soft pastel highlight tint based on section
            let activeClass = 'bg-[#EEEAFE] text-[#635BFF] border-[#635BFF]/10'; // default lavender
            if (item.label.toLowerCase().includes('overview')) {
              activeClass = 'bg-[#EEEAFE] text-[#635BFF] border-[#635BFF]/10'; // soft lavender
            } else if (item.label.toLowerCase().includes('complaint')) {
              activeClass = 'bg-[#FFF0E8] text-[#EF5B5B] border-[#EF5B5B]/10'; // soft peach
            } else if (item.label.toLowerCase().includes('notice')) {
              activeClass = 'bg-[#FFF8DD] text-[#F59E0B] border-[#F59E0B]/10'; // soft yellow
            } else if (item.label.toLowerCase().includes('profile') || item.label.toLowerCase().includes('setting')) {
              activeClass = 'bg-[#EEEAFE] text-[#635BFF] border-[#635BFF]/10'; // soft lavender
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 group border ${isActive
                  ? `${activeClass} shadow-sm`
                  : 'border-transparent text-text-secondary hover:text-brand-primary hover:bg-[#EEF2F7]/50'
                  }`}
              >
                <div className={`transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-brand-primary' : 'text-text-muted group-hover:text-brand-primary'}`}>
                  {item.icon}
                </div>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar Profile */}
        <div className="p-4 border-t border-brand-gray/40 bg-brand-gray-light/20">
          <div className="flex items-center gap-3 mb-3">
            {renderSidebarAvatar()}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-brand-charcoal truncate">{user?.name}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                  {user?.role === 'ADMIN' ? 'Secretary' : 'Resident'}
                </span>
                {user?.apartmentNumber && user?.role !== 'ADMIN' && (
                  <span className="text-[9px] text-text-muted font-bold truncate">
                    Flat {user?.apartmentNumber}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-brand-danger bg-[#FFF0E8] hover:bg-[#FFE2E2] transition-colors cursor-pointer border-0"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* 2. Main Page Area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-[#FDFBF7] border-b border-brand-gray/40 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-brand-gray-light cursor-pointer border-0"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Dynamic greeting */}
            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-brand-charcoal">
                {getGreeting()}, <span className="text-brand-primary">{user?.name}</span>
              </h1>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Welcome back to your dashboard</p>
            </div>

            <div className="sm:hidden flex items-center">
              <span className="text-xl font-extrabold text-brand-primary tracking-tight">SocietyCare</span>
            </div>
          </div>

          {/* Action indicators */}
          <div className="flex items-center gap-4">
            {/* Live dynamically updating Date/Time display */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#EEF2F7]/80 rounded-xl border border-brand-gray/40 text-[10px] font-extrabold text-brand-charcoal select-none">
              <Calendar className="w-3.5 h-3.5 text-brand-primary" />
              <span>{liveDateTime}</span>
            </div>


            {/* Real-time Notification Dropdown */}
            <div className="relative" ref={notifDropdownRef}>
              <button
                onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                className={`relative p-2.5 rounded-xl transition-all cursor-pointer border-0 bg-transparent ${notificationDropdownOpen ? 'text-brand-primary bg-brand-gray-light' : 'text-gray-400 hover:text-brand-primary hover:bg-brand-gray-light'
                  }`}
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-[10px] font-black text-white border-2 border-brand-card select-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationDropdownOpen && (
                <div
                  className="
      fixed top-[64px] left-2 right-2 w-auto
      sm:absolute sm:top-auto sm:left-auto sm:right-0 sm:w-96 sm:mt-3.5
      bg-white rounded-[24px] border border-brand-gray/40
      shadow-xl py-4 z-[60] animate-fade-in flex flex-col
    "
                  style={{ maxHeight: '420px' }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 pb-3 border-b border-brand-gray/30 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-brand-charcoal">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-extrabold bg-brand-primary/10 text-brand-primary rounded-full">
                          {unreadCount} New
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[10px] font-extrabold text-brand-primary hover:underline cursor-pointer border-0 bg-transparent"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {/* Scrollable list — shows 3 items visibly, scroll for more */}
                  <div
                    className="overflow-y-auto divide-y divide-brand-gray/35"
                    style={{ maxHeight: '240px' }}
                  >
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-2 select-none">
                        <div className="p-3 bg-brand-gray-light rounded-full text-gray-400">
                          <Bell className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-brand-charcoal">No new notifications</p>
                        <p className="text-[10px] text-gray-400 font-medium">You're all caught up!</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`flex gap-3 px-5 py-4 transition-all cursor-pointer relative group ${notif.isRead
                              ? 'bg-transparent hover:bg-brand-gray-light/35'
                              : 'bg-brand-primary/5 hover:bg-brand-primary/10 font-medium border-l-4 border-brand-primary'
                            }`}
                        >
                          {/* Icon column */}
                          <div className="p-2.5 bg-white border border-brand-gray rounded-xl shrink-0 h-fit shadow-sm">
                            {getNotificationIcon(notif.type)}
                          </div>

                          {/* Text column */}
                          <div className="flex-1 min-w-0 pr-4 space-y-1">
                            <p className={`text-xs text-brand-charcoal leading-normal ${!notif.isRead ? 'font-extrabold' : 'font-semibold'}`}>
                              {notif.message}
                            </p>
                            <span className="text-[9px] text-gray-400 font-bold block" title={new Date(notif.createdAt).toLocaleString()}>
                              {getRelativeTime(notif.createdAt)}
                            </span>
                          </div>

                          {/* Delete Column */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notif.id);
                            }}
                            className="absolute right-4 top-4 p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 cursor-pointer border-0 bg-transparent shrink-0"
                            title="Delete notification"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-full border border-brand-gray/50 hover:bg-brand-gray-light transition-all cursor-pointer bg-transparent"
              >
                {renderHeaderAvatar()}
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-brand-gray/50 shadow-lg py-2 z-20 animate-fade-in">
                  <div className="px-4 py-2 border-b border-brand-gray/40">
                    <p className="text-xs text-gray-400 font-semibold">Logged in as</p>
                    <p className="text-sm font-bold text-brand-charcoal truncate">{user?.name}</p>
                  </div>
                  <Link
                    to={isAdmin ? '/admin/settings' : '/profile'}
                    onClick={() => setProfileDropdownOpen(false)}
                    className="block px-4 py-2.5 text-sm text-gray-600 hover:text-brand-primary hover:bg-brand-gray-light transition-colors"
                  >
                    {isAdmin ? 'System Settings' : 'My Profile'}
                  </Link>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 cursor-pointer font-semibold border-0 bg-transparent"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content container */}
        <main className="flex-1 p-6 pb-24 md:p-8 md:pb-8 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>

      {/* 3. Mobile Navigation Menu Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-brand-charcoal/45 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative flex flex-col w-72 bg-brand-card h-full p-6 animate-fade-in shadow-2xl z-10 border-r border-brand-gray/40">
            <div className="flex items-center justify-between pb-6 border-b border-brand-gray/50">
              <span className="text-2xl font-extrabold text-brand-primary tracking-tight">SocietyCare</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:bg-brand-gray-light cursor-pointer border-0 bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-6 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = isNavItemActive(item);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${isActive
                      ? 'bg-brand-primary/5 text-brand-primary'
                      : 'text-gray-500 hover:text-brand-primary hover:bg-brand-gray-light'
                      }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-brand-gray/50 pt-4">
              <div className="flex items-center gap-3 mb-4">
                {renderDrawerAvatar()}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-brand-charcoal truncate">{user?.name}</p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                    {user?.role === 'ADMIN' ? 'Secretary' : 'Resident'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer border-0"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Mobile Bottom Navigation Bar (for fast mobile actions) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-brand-card/90 backdrop-blur-md border-t border-brand-gray/40 px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex items-center justify-around shadow-lg">
        {navItems.slice(0, 4).map((item) => {
          const isActive = isNavItemActive(item);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 p-1 rounded-xl text-[10px] font-semibold transition-colors ${isActive ? 'text-brand-primary' : 'text-gray-400 hover:text-brand-primary'
                }`}
            >
              {item.icon}
              <span className="truncate max-w-[70px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      {/* Spacer for bottom nav on mobile */}
      <div className="md:hidden pb-16" />
    </div>
  );
};

export default DashboardLayout;
