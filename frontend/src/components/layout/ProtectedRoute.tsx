'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, hasRole } from '@/context/AuthContext';
import { Role } from '@/types';
import { Loading } from '@/components/ui/Loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  fallbackPath?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  fallbackPath = '/login',
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(fallbackPath);
        return;
      }

      if (allowedRoles && user && !hasRole(user, allowedRoles)) {
        const defaultPath = getDefaultPath(user.role);
        router.push(defaultPath);
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, router, fallbackPath]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || (allowedRoles && user && !hasRole(user, allowedRoles))) {
    return null;
  }

  return <>{children}</>;
}

function getDefaultPath(role: Role): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'doctor':
      return '/doctor/prescriptions';
    case 'patient':
      return '/patient/prescriptions';
    default:
      return '/login';
  }
}