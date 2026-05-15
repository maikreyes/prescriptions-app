'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, Card, CardContent, StatusBadge, PageLoading, ErrorState } from '@/components/ui';
import api from '@/lib/api';
import { Prescription } from '@/types';
import { ArrowLeft, Printer } from 'lucide-react';

export default function DoctorPrescriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        const response = await api.get<Prescription>(`/prescriptions/${params.id}`);
        setPrescription(response.data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchPrescription();
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['doctor']}>
        <DashboardLayout>
          <PageLoading />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error || !prescription) {
    return (
      <ProtectedRoute allowedRoles={['doctor']}>
        <DashboardLayout>
          <ErrorState error={error || new Error('Prescription not found')} />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['doctor']}>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Detalle de Receta</h1>
          </div>

          <Card>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Código</p>
                  <p className="text-lg font-mono font-semibold text-gray-900">{prescription.code}</p>
                </div>
                <StatusBadge status={prescription.status} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Paciente</p>
                  <p className="font-medium text-gray-900">{prescription.patient.user.name}</p>
                  <p className="text-sm text-gray-600">{prescription.patient.user.email}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Doctor</p>
                  <p className="font-medium text-gray-900">{prescription.author.user.name}</p>
                  <p className="text-sm text-gray-600">{prescription.author.user.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Fecha de creación</p>
                  <p className="text-gray-900">
                    {new Date(prescription.createdAt).toLocaleString('es-CO')}
                  </p>
                </div>

                {prescription.consumedAt && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Fecha de consumo</p>
                    <p className="text-gray-900">
                      {new Date(prescription.consumedAt).toLocaleString('es-CO')}
                    </p>
                  </div>
                )}
              </div>

              {prescription.notes && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Notas</p>
                  <p className="text-gray-900">{prescription.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Medicamentos</h2>
              <div className="space-y-4">
                {prescription.items.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{index + 1}. {item.name}</p>
                        {item.dosage && (
                          <p className="text-sm text-gray-600">Dosis: {item.dosage}</p>
                        )}
                        {item.quantity && (
                          <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                        )}
                        {item.instructions && (
                          <p className="text-sm text-gray-600">Instrucciones: {item.instructions}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}