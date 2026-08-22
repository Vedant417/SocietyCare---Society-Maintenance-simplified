import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync token and verify user on mount
  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem('societycare_token');
      const savedUser = localStorage.getItem('societycare_user');

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }

        // Verify token with backend
        const response = await api.get('/auth/me');
        if (response.data.success) {
          const freshUser = response.data.data.user;
          setUser(freshUser);
          localStorage.setItem('societycare_user', JSON.stringify(freshUser));
        }
      } catch (error) {
        console.error('Failed to verify session token:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyUser();

    // Listen for session expiration events from API interceptor
    const handleAuthExpired = () => {
      setUser(null);
      // Optional: Store expired state to show toast on next page load
      localStorage.setItem('societycare_session_expired', 'true');
    };

    window.addEventListener('societycare_auth_expired', handleAuthExpired);
    return () => {
      window.removeEventListener('societycare_auth_expired', handleAuthExpired);
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        const { token, user: loggedUser } = response.data.data;
        localStorage.setItem('societycare_token', token);
        localStorage.setItem('societycare_user', JSON.stringify(loggedUser));
        setUser(loggedUser);
        return { success: true, user: loggedUser };
      }
      return { success: false, message: 'Invalid server response structure.' };
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Login failed. Please check your credentials.';
      return { success: false, message: errMsg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/register' || '/auth/register', userData); // handle fallback
      if (response.data.success) {
        const { token, user: registeredUser } = response.data.data;
        localStorage.setItem('societycare_token', token);
        localStorage.setItem('societycare_user', JSON.stringify(registeredUser));
        setUser(registeredUser);
        return { success: true, user: registeredUser };
      }
      return { success: false, message: 'Invalid registration response.' };
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Registration failed.';
      return { success: false, message: errMsg };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Backend logout failed or ignored:', err.message);
    } finally {
      localStorage.removeItem('societycare_token');
      localStorage.removeItem('societycare_user');
      setUser(null);
      setLoading(false);
    }
  };

  const updateUser = (updatedUser) => {
    localStorage.setItem('societycare_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isAuthenticated: !!user, isAdmin: user?.role === 'ADMIN' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
