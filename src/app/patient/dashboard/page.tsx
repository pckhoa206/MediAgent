import { PatientDashboard } from '@/components/patient/PatientDashboard';
import { RoleGuard } from '@/components/security/RoleGuard';

export default function PatientPage() {
  return (
    <RoleGuard allowedRoles={['patient']}>
      <main className="min-h-screen bg-slate-50 py-8">
        <PatientDashboard />
      </main>
    </RoleGuard>
  );
}
