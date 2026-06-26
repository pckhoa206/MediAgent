import EMRForm from '@/components/doctor/EMRForm';
import { RoleGuard } from '@/components/security/RoleGuard';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

export default function DoctorPage() {
  const { status, lastMessage } = useRealtimeSync();

  return (
    <RoleGuard allowedRoles={['doctor']}>
      <main className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Doctor Workspace</h1>
                <p className="text-sm text-gray-600">Welcome, Doctor. Your Electronic Medical Record form is below.</p>
              </div>
              <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                Sync: {status === 'connected' ? 'Connected' : 'Connecting'}
              </div>
            </div>
            {lastMessage && (
              <p className="mt-3 text-sm text-slate-600">
                Latest update: {lastMessage.type} · {lastMessage.payload?.department ?? 'queue'}
              </p>
            )}
          </div>

          <EMRForm />
        </div>
      </main>
    </RoleGuard>
  );
}
