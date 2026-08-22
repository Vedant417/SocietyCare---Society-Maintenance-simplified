import React from 'react';
import { Link } from 'react-router-dom';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-brand-ivory flex flex-col lg:flex-row">
      {/* Left side: Architectural/Community Illustration (Desktop only) */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[50%] relative bg-brand-gray-light overflow-hidden items-center justify-center select-none">
        <img 
          src="/login_illustration.png" 
          alt="SocietyCare Community" 
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        {/* Soft Lavender/Blue Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#635BFF]/15 via-[#7C6FF2]/10 to-transparent" />
        
        {/* Decorative branding info overlay */}
        <div className="relative z-10 p-12 max-w-md text-[#182230] space-y-4">
          <div className="bg-white border border-brand-gray/45 rounded-3xl p-8 shadow-md space-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-brand-primary">SocietyCare</h1>
            <p className="text-xs font-semibold text-[#667085] leading-relaxed">
              Society Maintenance, without the chaos. Experience seamless complaint tracking, real-time notifications, notice boards, and simplified community management.
            </p>
          </div>
        </div>
      </div>

      {/* Right side: Login Card */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-12 xl:px-20 bg-brand-ivory">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="text-center lg:text-left">
            <Link to="/" className="inline-block">
              <span className="text-4xl font-extrabold text-brand-primary tracking-tight">
                SocietyCare
              </span>
            </Link>
            <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold text-brand-charcoal tracking-tight">
              {title}
            </h2>
            <p className="mt-2 text-sm text-text-secondary font-semibold">
              {subtitle || 'Society Maintenance, without the chaos.'}
            </p>
          </div>

          <div className="bg-white border border-brand-gray/45 rounded-3xl p-6 sm:p-8 shadow-sm animate-fade-in">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
