'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('patient' | 'doctor' | 'admin')[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (role && !allowedRoles.includes(role)) {
      // User is authenticated but doesn't have the right role
      router.push('/unauthorized'); // or redirect to their respective dashboard
    } else {
      setIsAuthorized(true);
    }
    setIsChecking(false);
  }, [isAuthenticated, role, allowedRoles, router]);

  if (isChecking) {
    return <div className="flex items-center justify-center h-screen text-slate-500">Checking access permissions...</div>;
  }

  return isAuthorized ? <>{children}</> : null;
}
