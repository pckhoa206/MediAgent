import React from 'react';
import { LoginForm } from '../../components/auth/login-form';
import { Shield } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen w-screen flex-col items-center justify-center bg-slate-950 px-4 py-12">
      {/* Abstract Medical Accent Shapes */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-emerald-500/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-teal-500/5 blur-3xl" />

      {/* Main Login UI */}
      <div className="z-10 w-full flex flex-col items-center space-y-6">
        <LoginForm />

        <div className="flex items-center gap-2 text-slate-600 text-xxs tracking-wide uppercase font-semibold">
          <Shield className="h-3.5 w-3.5" />
          <span>Hệ thống bảo mật MedConcierge AI Enterprise</span>
        </div>
      </div>
    </div>
  );
}
