import { RegisterForm } from '@/components/auth/register-form';

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      {/* Background decoration matching login page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-emerald-900/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-slate-800/30 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="z-10 w-full max-w-md">
        <RegisterForm />
      </div>
    </main>
  );
}
