'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export function RegisterForm() {
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [cccd, setCccd] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('male');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validate Citizen ID (Vietnam CCCD: 12 digits, province code 001–096)
    const cccdRegex = /^[0-9]{12}$/;
    if (!cccdRegex.test(cccd)) {
      setErrorMsg('Citizen ID must be exactly 12 numeric digits.');
      return;
    }
    const provinceCode = parseInt(cccd.substring(0, 3));
    if (provinceCode < 1 || provinceCode > 96) {
      setErrorMsg('Invalid province prefix (first 3 digits must be 001–096).');
      return;
    }

    if (!fullName.trim() || !dob) {
      setErrorMsg('Full name and date of birth are required.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (role === 'doctor') {
      const docIdRegex = /^DOC-[0-9]{5}$/;
      if (!doctorId.trim()) {
        setErrorMsg('Doctor ID is required for Doctor accounts.');
        return;
      }
      if (!docIdRegex.test(doctorId)) {
        setErrorMsg('Doctor ID must follow the DOC-XXXXX format (e.g., DOC-12345).');
        return;
      }
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cccd, password, role, fullName, dob, gender, doctorId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Registration failed.');
      }

      setSuccessMsg('Registration successful! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please check your information.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-900 bg-slate-950/60 p-8 backdrop-blur-md shadow-2xl shadow-slate-950/50">
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <KeyRound className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-100">
          Create Account
        </h2>
        <p className="text-xs text-slate-400">
          Register a new account on MediAgent
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

      {/* Error Alert */}
      {errorMsg && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-xs font-medium text-red-400"
        >
          <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Success Alert */}
      {successMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-950/20 p-4 text-xs font-medium text-green-400">
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label htmlFor="fullName" className="text-xs font-semibold text-slate-400">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </div>

        {/* DOB & Gender */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="dob" className="text-xs font-semibold text-slate-400">Date of Birth</label>
            <input
              id="dob"
              type="date"
              required
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="gender" className="text-xs font-semibold text-slate-400">Gender</label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Citizen ID */}
        <div className="space-y-1.5">
          <label htmlFor="cccd" className="text-xs font-semibold text-slate-400">
            Citizen ID (CCCD — 12 digits)
          </label>
          <input
            id="cccd"
            type="text"
            required
            maxLength={12}
            value={cccd}
            onChange={(e) => setCccd(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="Enter 12-digit ID"
            className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </div>

        {/* Doctor ID (conditional) */}
        {role === 'doctor' && (
          <div className="space-y-1.5">
            <label htmlFor="doctorId" className="text-xs font-semibold text-slate-400">
              Doctor ID
            </label>
            <input
              id="doctorId"
              type="text"
              required
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              placeholder="e.g. DOC-12345"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>
        )}

        {/* Password */}
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
            placeholder="Min. 6 characters"
            className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-400">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-md hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 transition-all duration-200 mt-4"
        >
          {isLoading ? 'Creating account...' : 'Register'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <Link href="/login" className="text-sm text-emerald-500 hover:text-emerald-400 transition-colors">
          Already have an account? Sign in
        </Link>
      </div>
    </div>
  );
}
