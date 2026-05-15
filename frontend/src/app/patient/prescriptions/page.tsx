'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, Card, CardContent, Select, StatusBadge, Pagination, PageLoading, EmptyState, ErrorState } from '@/components/ui';
import api from '@/lib/api';
import { Prescription, PaginatedResponse } from '@/types';
import { Eye, Download, CheckCircle } from 'lucide-react';

interface QueryParams {
  page: number;
  limit: number;
  status?: string;
}

export default function PatientPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [query, setQuery] = useState<QueryParams>({
    page: 1,
    limit: 10,
  });

  const fetchPrescriptions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: query.page.toString(),
        limit: query.limit.toString(),
      });

      if (query.status) params.append('status', query.status);

      const response = await api.get<PaginatedResponse<Prescription>>(`/me/prescriptions?${params}`);
      setPrescriptions(response.data.data);
      setMeta(response.data.meta);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const handlePageChange = (newPage: number) => {
    setQuery((prev) => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (key: keyof QueryParams, value: string) => {
    setQuery((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleConsume = async (prescriptionId: string) => {
    if (!confirm('¿Está seguro que desea marcar esta receta como consumida?')) {
      return;
    }

    try {
      await api.post(`/prescriptions/${prescriptionId}/consume`);
      fetchPrescriptions();
    } catch (err) {
      alert('Error al consumir la receta');
    }
  };

  const handleDownloadPdf = async (prescriptionId: string, code: string) => {
    try {
      const response = await api.get(`/prescriptions/${prescriptionId}/pdf`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `prescription-${code}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Error al descargar el PDF');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['patient']}>
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Mis Recetas</h1>

          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Estado"
                  value={query.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  options={[
                    { value: '', label: 'Todas' },
                    { value: 'pending', label: 'Pendiente' },
                    { value: 'consumed', label: 'Consumida' },
                  ]}
                />
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <PageLoading />
          ) : error ? (
            <ErrorState error={error} reset={fetchPrescriptions} />
          ) : prescriptions.length === 0 ? (
            <EmptyState message="No se encontraron recetas" />
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {prescriptions.map((prescription) => (
                      <tr key={prescription.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">{prescription.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{prescription.author.user.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(prescription.createdAt).toLocaleDateString('es-CO')}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={prescription.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.location.href = `/patient/prescriptions/${prescription.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadPdf(prescription.id, prescription.code)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            {prescription.status === 'pending' && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleConsume(prescription.id)}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {!isLoading && !error && prescriptions.length > 0 && (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}