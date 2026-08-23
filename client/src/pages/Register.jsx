import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { registerSchema } from '../validations/schemas';
import AuthLayout from '../layouts/AuthLayout';
import {
  User,
  Mail,
  Phone,
  Home,
  KeyRound,
  Loader2,
  Eye,
  EyeOff,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import DatePicker from '../components/DatePicker';
import api from '../services/api';

const Register = () => {
  const { login, isAuthenticated, user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  // Auto redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  const calculateAge = (dob) => {
    if (!dob) return null;
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  };
  const dobAge = dateOfBirth ? calculateAge(dateOfBirth) : null;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        phone: data.phone,
        apartmentNumber: data.apartmentNumber,
        password: data.password,
        confirmPassword: data.confirmPassword,
        gender: gender || null,
        dateOfBirth: dateOfBirth || null,
      });

      if (response.data.success) {
        showToast('Registration successful! Logging in...', 'success');
        // Register response returns token, auto-log in by storing details
        const { token, user } = response.data.data;
        localStorage.setItem('societycare_token', token);
        localStorage.setItem('societycare_user', JSON.stringify(user));

        // Hard-reload/redirect user to dashboard
        window.location.href = '/dashboard';
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Registration failed. Please check inputs.';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
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
    <AuthLayout title="Create an account" subtitle="Join SocietyCare to track maintenance requests">
      <form
        onSubmit={handleSubmit(onSubmit)}
        autoComplete="off"
        className="space-y-5"
      >
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <User className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Enter your full name"
              {...register('name')}
              className={`block w-full pl-10 pr-4 py-2.5 bg-brand-ivory/50 border ${errors.name ? 'border-brand-danger focus:ring-brand-danger/20' : 'border-brand-gray focus:ring-brand-primary/20'
                } rounded-2xl text-sm text-brand-charcoal focus:border-brand-primary focus:ring-4 focus:outline-none transition-all`}
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-xs font-semibold text-brand-danger">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
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
              autoComplete="off"
              placeholder="Enter your email address"
              {...register('email')}
              className={`block w-full pl-10 pr-4 py-2.5 bg-brand-ivory/50 border ${errors.email ? 'border-brand-danger focus:ring-brand-danger/20' : 'border-brand-gray focus:ring-brand-primary/20'
                } rounded-2xl text-sm text-brand-charcoal focus:border-brand-primary focus:ring-4 focus:outline-none transition-all`}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs font-semibold text-brand-danger">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Phone & Flat Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                placeholder="Phone number"
                {...register('phone')}
                className={`block w-full pl-9 pr-4 py-2.5 bg-brand-ivory/50 border ${errors.phone ? 'border-brand-danger focus:ring-brand-danger/20' : 'border-brand-gray focus:ring-brand-primary/20'
                  } rounded-2xl text-sm text-brand-charcoal focus:border-brand-primary focus:ring-4 focus:outline-none transition-all`}
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-xs font-semibold text-brand-danger">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Apartment */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Apartment / Flat
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Home className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="A101"
                {...register('apartmentNumber')}
                className={`block w-full pl-9 pr-4 py-2.5 bg-brand-ivory/50 border ${errors.apartmentNumber ? 'border-brand-danger focus:ring-brand-danger/20' : 'border-brand-gray focus:ring-brand-primary/20'
                  } rounded-2xl text-sm text-brand-charcoal focus:border-brand-primary focus:ring-4 focus:outline-none transition-all`}
              />
            </div>
            {errors.apartmentNumber && (
              <p className="mt-1 text-xs font-semibold text-brand-danger">
                {errors.apartmentNumber.message}
              </p>
            )}
          </div>
        </div>

        {/* Gender & DOB Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Gender */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Gender</label>
            <div className="relative">
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="block w-full px-4 py-2.5 bg-brand-ivory/50 border border-brand-gray rounded-2xl text-sm text-brand-charcoal focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/20 focus:outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">Prefer not to say</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Date of Birth
              {dobAge !== null && <span className="ml-2 normal-case text-brand-primary font-extrabold">→ Age {dobAge}</span>}
            </label>
            <DatePicker
              value={dateOfBirth}
              onChange={setDateOfBirth}
              max={new Date().toISOString().split('T')[0]}
              placeholder="DD-MM-YYYY"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Password
          </label>

          <div className="relative">
            {/* Password Icon */}
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <KeyRound className="w-5 h-5" />
            </div>

            {/* Password Input */}
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Enter your password"
              {...register('password')}
              className={`block w-full pl-10 pr-12 py-2.5 bg-brand-ivory/50 border ${errors.password
                ? 'border-brand-danger focus:ring-brand-danger/20'
                : 'border-brand-gray focus:ring-brand-primary/20'
                } rounded-2xl text-sm text-brand-charcoal focus:border-brand-primary focus:ring-4 focus:outline-none transition-all`}
            />

            {/* Show / Hide Password */}
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
            <p className="mt-1 text-xs font-semibold text-brand-danger">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Confirm Password
          </label>

          <div className="relative">
            {/* Password Icon */}
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <KeyRound className="w-5 h-5" />
            </div>

            {/* Confirm Password Input */}
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Confirm your password"
              {...register('confirmPassword')}
              className={`block w-full pl-10 pr-12 py-2.5 bg-brand-ivory/50 border ${errors.confirmPassword
                ? 'border-brand-danger focus:ring-brand-danger/20'
                : 'border-brand-gray focus:ring-brand-primary/20'
                } rounded-2xl text-sm text-brand-charcoal focus:border-brand-primary focus:ring-4 focus:outline-none transition-all`}
            />

            {/* Show / Hide Confirm Password */}
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-brand-primary transition-colors cursor-pointer"
              aria-label={
                showConfirmPassword
                  ? 'Hide confirm password'
                  : 'Show confirm password'
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {errors.confirmPassword && (
            <p className="mt-1 text-xs font-semibold text-brand-danger">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-2xl shadow-md text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary-light focus:outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Register'
          )}
        </button>

        {/* Redirect */}
        <div className="text-center text-sm font-medium text-gray-500">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-brand-primary hover:text-brand-primary-light transition-colors">
            Log in here
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Register;
