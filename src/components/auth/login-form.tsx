'use client';

import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, ShieldAlert, FileText, UserPlus } from 'lucide-react';

export function LoginForm() {
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [cccd, setCccd] = useState('');
  const [password, setPassword] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loginStore = useAuthStore((state) => state.login);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validate CCCD
    const cccdRegex = /^[0-9]{12}$/;
    if (!cccdRegex.test(cccd)) {
      setErrorMsg('Citizen ID must be exactly 12 digits.');
      return;
    }

    // 2. Validate Password
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    // 3. Validate Doctor ID if Doctor role is selected
    if (role === 'doctor') {
      const docIdRegex = /^DOC-[0-9]{5}$/;
      if (!doctorId.trim()) {
        setErrorMsg('Doctor ID is required for Doctor accounts.');
        return;
      }
      if (!docIdRegex.test(doctorId)) {
        setErrorMsg('Doctor ID must be in DOC-XXXXX format (e.g., DOC-12345).');
        return;
      }
    }

    setIsLoading(true);

    try {
      // Call the Mock Login API
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cccd, password, role, doctorId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await res.json();

      loginStore({
        cccd: data.user.cccd,
        role: data.user.role,
        doctorId: data.user.doctorId,
        userName: data.user.userName || (data.user.role === 'doctor' ? 'Anonymous Doctor' : 'Anonymous Patient'),
        token: data.token,
      });

      // Redirect based on role
      if (role === 'doctor') {
        router.push('/doctor/dashboard');
      } else {
        router.push('/chat');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your information.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-900 bg-slate-950/60 p-8 backdrop-blur-md shadow-2xl shadow-slate-950/50">
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <ShieldAlert className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-100">
          System Login Portal
        </h2>
        <p className="text-xs text-slate-400">
          Please enter your ID and credentials
        </p>
      </div>

      {/* Role Tabs */}
      <div className="grid w-full grid-cols-2 rounded-xl bg-slate-900/60 p-1 border border-slate-800" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={role === 'patient'}
          onClick={() => { setRole('patient'); setErrorMsg(''); }}
          className={`rounded-lg py-2.5 text-xs font-semibold transition-all duration-200 ${
            role === 'patient'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Patient
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={role === 'doctor'}
          onClick={() => { setRole('doctor'); setErrorMsg(''); }}
          className={`rounded-lg py-2.5 text-xs font-semibold transition-all duration-200 ${
            role === 'doctor'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Doctor
        </button>
      </div>

      {/* Error Announcement */}
      {errorMsg && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-xs font-medium text-red-400 animate-headShake"
        >
          <ShieldAlert className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* CCCD Input */}
        <div className="space-y-1.5">
          <label htmlFor="cccd" className="text-xs font-semibold text-slate-400">
            Citizen ID (CCCD)
          </label>
          <input
            id="cccd"
            type="text"
            required
            maxLength={12}
            value={cccd}
            onChange={(e) => setCccd(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="Enter 12 digits"
            aria-describedby={errorMsg ? 'error-announcement' : undefined}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </div>

        {/* Password Input */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-xs font-semibold text-slate-400">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </div>

        {/* Doctor ID Dynamic Input */}
        {role === 'doctor' && (
          <div className="space-y-1.5 animate-fadeIn">
            <label htmlFor="doctorId" className="text-xs font-semibold text-slate-400">
              Doctor ID
            </label>
            <input
              id="doctorId"
              type="text"
              required
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              placeholder="e.g.: DOC-12345"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>
        )}

        {/* Action Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-md hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 transition-all duration-200"
        >
          {isLoading ? 'Authenticating...' : 'Login'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <Link href="/register" className="text-sm text-emerald-500 hover:text-emerald-400 transition-colors">
          Don't have an account? Register now
        </Link>
      </div>
    </div>
  );
}
