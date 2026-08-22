import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { loginSchema } from '../validations/schemas';
import AuthLayout from '../layouts/AuthLayout';
import { KeyRound, Mail, Loader2, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const { login, isAuthenticated, user, loading: authLoading } = useAuth();
  const { showToast } = useState(() => {
    // Check if there was an expired session redirect
    const expired = localStorage.getItem('societycare_session_expired');
    if (expired) {
      localStorage.removeItem('societycare_session_expired');
      // We can trigger this after component mount
    }
  });
  const { showToast: toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Auto redirect if already authenticated
  React.useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  // Trigger session expired message if flagged
  React.useEffect(() => {
    const expired = localStorage.getItem('societycare_session_expired');
    if (expired) {
      localStorage.removeItem('societycare_session_expired');
      toast('Your session has expired. Please log in again.', 'warning');
    }
  }, [toast]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    const result = await login(data.email, data.password);
    setLoading(false);

    if (result.success) {
      toast('Logged in successfully!', 'success');
      if (result.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      toast(result.message, 'error');
    }
  };

  if (authLoading || (isAuthenticated && user)) {
    return (
      <div className="min-h-screen bg-brand-ivory flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-brand-primary/20 border-t-brand-primary animate-spin" />
        <p className="text-sm font-semibold text-gray-500 animate-pulse">Checking session...</p>
      </div>
    );
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to manage your maintenance requests">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email Input */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              placeholder="Enter your email address"
              {...register('email')}
              className={`block w-full pl-10 pr-4 py-3 bg-brand-ivory/50 border ${errors.email ? 'border-brand-danger focus:ring-brand-danger/20' : 'border-brand-gray focus:ring-brand-primary/20'
                } rounded-2xl text-sm text-brand-charcoal focus:border-brand-primary focus:ring-4 focus:outline-none transition-all`}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-xs font-semibold text-brand-danger">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Input */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Password
          </label>

          <div className="relative">
            {/* Password Icon */}
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <KeyRound className="w-5 h-5" />
            </div>

            {/* Password Field */}
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              {...register('password')}
              className={`block w-full pl-10 pr-12 py-3 bg-brand-ivory/50 border ${errors.password
                  ? 'border-brand-danger focus:ring-brand-danger/20'
                  : 'border-brand-gray focus:ring-brand-primary/20'
                } rounded-2xl text-sm text-brand-charcoal focus:border-brand-primary focus:ring-4 focus:outline-none transition-all`}
            />

            {/* Show / Hide Password Button */}
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-brand-primary transition-colors cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {errors.password && (
            <p className="mt-1.5 text-xs font-semibold text-brand-danger">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-2xl shadow-md text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary-light focus:outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Log In'
          )}
        </button>

        {/* Seed Credentials Guide */}
        <div className="bg-brand-ivory border border-brand-gray/50 rounded-2xl p-4 text-xs text-gray-500 space-y-1">
          <p className="font-bold text-brand-charcoal mb-1">Development Demo Credentials:</p>
          <p><span className="font-semibold text-brand-primary">Secretary:</span> admin@example.com / Admin@123</p>
          <p><span className="font-semibold text-brand-primary">Resident:</span> rahul@example.com / Password@123</p>
        </div>

        {/* Redirect Link */}
        <div className="text-center text-sm font-medium text-gray-500">
          New resident?{' '}
          <Link to="/register" className="font-bold text-brand-primary hover:text-brand-primary-light transition-colors">
            Register here
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Login;
