'use client';

import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useRouter } from 'next/navigation';
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

    // 1. Validate CCCD Format (strict 12 digits)
    const cccdRegex = /^[0-9]{12}$/;
    if (!cccdRegex.test(cccd)) {
      setErrorMsg('Mã định danh CCCD phải đủ 12 chữ số.');
      return;
    }

    // 2. Validate Password
    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }

    // 3. Validate Doctor ID if Doctor role is selected
    if (role === 'doctor') {
      const docIdRegex = /^DOC-[0-9]{5}$/;
      if (!doctorId.trim()) {
        setErrorMsg('Mã bác sĩ là bắt buộc đối với tài khoản Bác sĩ.');
        return;
      }
      if (!docIdRegex.test(doctorId)) {
        setErrorMsg('Mã bác sĩ phải đúng định dạng DOC-XXXXX (Ví dụ: DOC-12345).');
        return;
      }
    }

    setIsLoading(true);

    try {
      // Simulate API verification and internal key exchange
      await new Promise((resolve) => setTimeout(resolve, 800));

      const mockToken = `mock-api-key-${crypto.randomUUID().slice(0, 8)}`;
      const name = role === 'doctor' ? 'Bác sĩ Nguyễn Văn Nam' : 'Bệnh Nhân Minh Khoa';

      loginStore({
        cccd,
        role,
        doctorId: role === 'doctor' ? doctorId : undefined,
        userName: name,
        token: mockToken,
      });

      // Redirect based on role
      if (role === 'doctor') {
        router.push('/doctor/dashboard');
      } else {
        router.push('/chat');
      }
    } catch (err) {
      setErrorMsg('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
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
          Cổng Đăng Nhập Hệ Thống
        </h2>
        <p className="text-xs text-slate-400">
          Vui lòng điền thông tin CCCD và tài khoản doanh nghiệp được cấp
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
          Bệnh Nhân
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
          Bác Sĩ
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
            Số Định Danh (CCCD)
          </label>
          <input
            id="cccd"
            type="text"
            required
            maxLength={12}
            value={cccd}
            onChange={(e) => setCccd(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="Nhập 12 chữ số CCCD"
            aria-describedby={errorMsg ? 'error-announcement' : undefined}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </div>

        {/* Password Input */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-xs font-semibold text-slate-400">
            Mật Khẩu
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu"
            className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </div>

        {/* Doctor ID Dynamic Input */}
        {role === 'doctor' && (
          <div className="space-y-1.5 animate-fadeIn">
            <label htmlFor="doctorId" className="text-xs font-semibold text-slate-400">
              Mã Bác Sĩ (Doctor ID)
            </label>
            <input
              id="doctorId"
              type="text"
              required
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              placeholder="Ví dụ: DOC-12345"
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
          {isLoading ? 'Đang xác thực...' : 'Đăng Nhập'}
        </button>
      </form>
    </div>
  );
}
