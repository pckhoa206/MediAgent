import EMRForm from '@/components/doctor/EMRForm';
import { RoleGuard } from '@/components/security/RoleGuard';

export default function DoctorPage() {
  return (
    <RoleGuard allowedRoles={['doctor']}>
      <main className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-gray-800">Doctor Workspace</h1>
          <p className="text-sm text-gray-600 mb-6">Welcome, Doctor. Your Electronic Medical Record form is below.</p>
          
          <EMRForm />
        </div>
      </main>
    </RoleGuard>
  );
}
