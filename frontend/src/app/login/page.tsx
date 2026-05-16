'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Button, Input, Card, CardContent } from '@/components/ui';
import { Stethoscope } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    try {
      await login(data.email, data.password);
      const userRole = JSON.parse(localStorage.getItem('user') || '{}').role;
      
      switch (userRole) {
        case 'admin':
          router.push('/admin');
          break;
        case 'doctor':
          router.push('/doctor/prescriptions');
          break;
        case 'patient':
          router.push('/patient/prescriptions');
          break;
        default:
          router.push('/login');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Stethoscope className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Medical RX</h1>
            <p className="text-gray-600">Ingresa a tu cuenta</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <Input
              {...register('email')}
              type="email"
              label="Correo electrónico"
              placeholder="correo@ejemplo.com"
              error={errors.email?.message}
            />

            <Input
              {...register('password')}
              type="password"
              label="Contraseña"
              placeholder="••••••••"
              error={errors.password?.message}
            />

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Iniciar Sesión
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Credenciales de prueba:</p>
            <p>admin@test.com / admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}