'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { hasRole } from '@/context/AuthContext';
import { Role, User } from '@/types';
import { FileText, Users, BarChart3, LogOut, Menu, X, Stethoscope, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const roleLinks: Record<Role, { href: string; label: string; icon: React.ReactNode }[]> = {
  admin: [
    { href: '/admin', label: 'Dashboard', icon: <BarChart3 className="w-5 h-5" /> },
  ],
  doctor: [
    { href: '/doctor/prescriptions', label: 'Recetas', icon: <ClipboardList className="w-5 h-5" /> },
  ],
  patient: [
    { href: '/patient/prescriptions', label: 'Mis Recetas', icon: <FileText className="w-5 h-5" /> },
  ],
};

function getDashboardPath(role: Role): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'doctor':
      return '/doctor/prescriptions';
    case 'patient':
      return '/patient/prescriptions';
    default:
      return '/';
  }
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const links = roleLinks[user.role] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              >
                {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <a href={getDashboardPath(user.role)} className="text-xl font-bold text-blue-600 ml-2 lg:ml-0">
                Medical RX
              </a>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:block">
                <span className="text-sm text-gray-700">{user.name}</span>
                <span className="text-xs text-gray-500 ml-2 capitalize">({user.role})</span>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="lg:flex">
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 pt-16 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:pt-0',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <nav className="p-4 space-y-2">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors',
                  pathname === link.href || pathname.startsWith(link.href + '/')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                {link.icon}
                <span className="font-medium">{link.label}</span>
              </a>
            ))}
          </nav>
        </aside>
      </div>

      <main className="pt-20 lg:pt-6 lg:pl-64 p-4 lg:p-8 max-w-7xl mx-auto">
        {children}
      </main>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}