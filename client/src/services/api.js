import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('societycare_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle session expiration (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear local storage and dispatch event to alert Auth Context
      localStorage.removeItem('societycare_token');
      localStorage.removeItem('societycare_user');
      
      // Only redirect/reload if not already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.dispatchEvent(new Event('societycare_auth_expired'));
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Resolve a profile photo URL for use in an <img> tag.
 * - Preloaded SVG avatars (e.g. /avatars/cat.svg) → returned as-is (served from client/public)
 * - Custom uploaded avatar endpoint (e.g. /api/auth/avatar?fileId=...) → prepend backend base URL with token
 * - External URLs (Cloudinary etc.) → returned as-is
 * - Null/empty → empty string
 */
export const getPhotoUrl = (url) => {
  if (!url) return '';
  // Preloaded illustrated avatars served from client public folder
  if (url.startsWith('/avatars/')) return url;
  // Already a full external URL (Cloudinary or other CDN)
  if (url.startsWith('http')) return url;
  // Backend API URL — prepend the backend host with auth token
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const token = localStorage.getItem('societycare_token');
  const serverBase = baseUrl.replace(/\/api$/, '');
  const fullUrl = `${serverBase}${url}`;
  return `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}token=${token}`;
};

export default api;
