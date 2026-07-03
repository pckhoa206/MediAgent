'use client';

import { useState } from 'react';
import type { Lang, TranslationKey } from '@/constants/translations';
import { VALID_DOCTOR_IDS } from '@/constants/translations';

interface AuthPortalProps {
  lang: Lang;
  t: (key: TranslationKey) => string;
  onLoginSuccess: (data: { token: string; user: { cccd: string; userName: string; role: 'patient' | 'doctor' | 'admin'; doctorId?: string } }) => void;
}

export function AuthPortal({ lang, t, onLoginSuccess }: AuthPortalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [fullName, setFullName] = useState('');
  const [cccd, setCccd] = useState('');
  const [password, setPassword] = useState('');
  const [doctorId, setDoctorId] = useState('DOC-11223');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cccd, password, role, fullName, doctorId: role === 'doctor' ? doctorId : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert(t('registerSuccess'));
      setIsSignUp(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const loginCccd = role === 'doctor' ? cccd || `doc-${doctorId}` : cccd;
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cccd: loginCccd, password, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onLoginSuccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('userNotFound'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0f1712]/60 border border-[#1c2e24] rounded-3xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-200">{isSignUp ? t('registerSystem') : t('loginSystem')}</h2>
        <div className="flex gap-2">
          {(['patient', 'doctor'] as const).map((r) => (
            <button key={r} type="button" onClick={() => setRole(r)} className={`flex-1 py-2 text-xs font-bold rounded-xl ${role === r ? 'bg-[#4d7c5d] text-white' : 'bg-[#070b09] text-slate-400'}`}>
              {r === 'patient' ? t('submitLoginPatient') : t('submitLoginDoctor')}
            </button>
          ))}
        </div>
        <form onSubmit={isSignUp ? handleRegister : handleLogin} className="space-y-3">
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t('name')} required className="w-full bg-[#070b09] border border-[#1c2e24] rounded-xl px-3 py-2.5 text-xs text-slate-200" aria-label={t('name')} />
          {role === 'patient' ? (
            <input type="text" value={cccd} onChange={(e) => setCccd(e.target.value)} placeholder={t('cccd')} required pattern="\d{12}" className="w-full bg-[#070b09] border border-[#1c2e24] rounded-xl px-3 py-2.5 text-xs text-slate-200" aria-label={t('cccd')} />
          ) : (
            <>
              <input type="text" value={cccd} onChange={(e) => setCccd(e.target.value)} placeholder={t('cccd')} className="w-full bg-[#070b09] border border-[#1c2e24] rounded-xl px-3 py-2.5 text-xs text-slate-200" aria-label={t('cccd')} />
              <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="w-full bg-[#070b09] border border-[#1c2e24] rounded-xl px-3 py-2.5 text-xs text-slate-200" aria-label={t('docId')}>
                {VALID_DOCTOR_IDS.map((id) => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </>
          )}
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('password')} required className="w-full bg-[#070b09] border border-[#1c2e24] rounded-xl px-3 py-2.5 text-xs text-slate-200" aria-label={t('password')} />
          {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 bg-[#4d7c5d] text-white font-bold text-sm rounded-xl disabled:opacity-50">
            {loading ? '...' : isSignUp ? (role === 'patient' ? t('submitRegisterPatient') : t('submitRegisterDoctor')) : (role === 'patient' ? t('submitLoginPatient') : t('submitLoginDoctor'))}
          </button>
        </form>
        <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-xs text-[#7FB08E] w-full text-center">
          {isSignUp ? t('login') : t('register')}
        </button>
      </div>
    </div>
  );
}
