import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import Login from './pages/Login';
import Register from './pages/Register';

// Resident pages
import ResidentDashboard from './pages/ResidentDashboard';
import ResidentComplaints from './pages/ResidentComplaints';
import NewComplaint from './pages/NewComplaint';
import ComplaintDetail from './pages/ComplaintDetail';
import NoticeBoard from './pages/NoticeBoard';
import Emergency from './pages/Emergency';
import Profile from './pages/Profile';

// Admin pages
import AdminDashboard from './pages/AdminDashboard';
import AdminComplaints from './pages/AdminComplaints';
import AdminComplaintDetail from './pages/AdminComplaintDetail';
import AdminNotices from './pages/AdminNotices';
import NewNotice from './pages/NewNotice';
import AdminResidents from './pages/AdminResidents';
import AdminSettings from './pages/AdminSettings';
import AdminSocietyPulse from './pages/AdminSocietyPulse';

function App() {
  return (
    <Routes>
      {/* Public Guest Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Resident Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <ResidentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/complaints"
        element={
          <ProtectedRoute>
            <ResidentComplaints />
          </ProtectedRoute>
        }
      />
      <Route
        path="/complaints/new"
        element={
          <ProtectedRoute>
            <NewComplaint />
          </ProtectedRoute>
        }
      />
      <Route
        path="/complaints/:id"
        element={
          <ProtectedRoute>
            <ComplaintDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notices"
        element={
          <ProtectedRoute>
            <NoticeBoard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/emergency"
        element={
          <ProtectedRoute>
            <Emergency />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Admin Dashboard Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/complaints"
        element={
          <ProtectedRoute adminOnly>
            <AdminComplaints />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/complaints/:id"
        element={
          <ProtectedRoute adminOnly>
            <AdminComplaintDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/notices"
        element={
          <ProtectedRoute adminOnly>
            <AdminNotices />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/notices/new"
        element={
          <ProtectedRoute adminOnly>
            <NewNotice />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/residents"
        element={
          <ProtectedRoute adminOnly>
            <AdminResidents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute adminOnly>
            <AdminSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/society-pulse"
        element={
          <ProtectedRoute adminOnly>
            <AdminSocietyPulse />
          </ProtectedRoute>
        }
      />

      {/* Fallbacks */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
