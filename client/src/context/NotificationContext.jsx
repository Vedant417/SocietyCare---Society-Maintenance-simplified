import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';
import { io } from 'socket.io-client';

const NotificationContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
  (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000');

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);

  // Fetch persisted notifications on initial load or user change
  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const response = await api.get('/notifications');
      if (response.data.success) {
        setNotifications(response.data.data);
        const unread = response.data.data.filter((n) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [isAuthenticated]);

  // Establish WebSockets (Socket.IO) client connection
  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const token = localStorage.getItem('societycare_token');
    
    // Connect to WebSocket server with authorization payload
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    setSocket(newSocket);

    // Listen for incoming notifications in real time
    newSocket.on('notification', (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      
      // Play a subtle notification sound (optional, silent fallback)
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.4;
        audio.play().catch(() => {});
      } catch (e) {}
    });

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated]);

  // Actions: Mark as Read
  const markAsRead = async (id) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await api.patch(`/notifications/${id}/read`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Revert on error
      fetchNotifications();
    }
  };

  // Actions: Delete Notification
  const deleteNotification = async (id) => {
    try {
      const notifToDelete = notifications.find((n) => n.id === id);
      const wasUnread = notifToDelete ? !notifToDelete.isRead : false;

      // Optimistic update
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      await api.delete(`/notifications/${id}`);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      // Revert on error
      fetchNotifications();
    }
  };

  // Actions: Mark All as Read
  const markAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      await api.patch('/notifications/read-all');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      fetchNotifications();
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        deleteNotification,
        markAllAsRead,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
