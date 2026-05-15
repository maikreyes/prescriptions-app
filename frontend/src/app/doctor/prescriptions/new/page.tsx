'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, Card, CardContent, Input, Select, PageLoading } from '@/components/ui';
import api from '@/lib/api';
import { PatientListItem, DoctorListItem } from '@/types';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';

const prescriptionItemSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  dosage: z.string().optional(),
  quantity: z.number().optional(),
  instructions: z.string().optional(),
});

const prescriptionSchema = z.object({
  patientId: z.string().min(1, 'El paciente es requerido'),
  notes: z.string().optional(),
  items: z.array(prescriptionItemSchema).min(1, 'Al menos un medicamento es requerido'),
});

type PrescriptionFormData = z.infer<typeof prescriptionSchema>;

export default function NewPrescriptionPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PrescriptionFormData>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      items: [{ name: '', dosage: '', quantity: undefined, instructions: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await api.get('/patients?page=1&limit=100');
        setPatients(response.data.data);
      } catch (err) {
        console.error('Error fetching patients:', err);
      } finally {
        setIsLoadingPatients(false);
      }
    };

    fetchPatients();
  }, []);

  const onSubmit = async (data: PrescriptionFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await api.post('/prescriptions', {
        patientId: data.patientId,
        notes: data.notes || undefined,
        items: data.items.map(item => ({
          name: item.name,
          dosage: item.dosage || undefined,
          quantity: item.quantity || undefined,
          instructions: item.instructions || undefined,
        })),
      });

      router.push('/doctor/prescriptions');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error al crear la receta');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingPatients) {
    return (
      <ProtectedRoute allowedRoles={['doctor']}>
        <DashboardLayout>
          <PageLoading />
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
            <h1 className="text-2xl font-bold text-gray-900">Nueva Receta</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <Card>
              <CardContent className="space-y-4">
                <Select
                  {...register('patientId')}
                  label="Paciente"
                  error={errors.patientId?.message}
                  options={[
                    { value: '', label: 'Seleccionar paciente...' },
                    ...patients.map((patient) => ({
                      value: patient.patient.id,
                      label: `${patient.name} (${patient.email})`,
                    })),
                  ]}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas (opcional)
                  </label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Notas adicionales para la receta..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Medicamentos</h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ name: '', dosage: '', quantity: undefined, instructions: '' })}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar
                  </Button>
                </div>

                {errors.items?.message && (
                  <p className="text-sm text-red-600">{errors.items.message}</p>
                )}

                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-sm font-medium text-gray-700">
                          Medicamento #{index + 1}
                        </span>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          {...register(`items.${index}.name` as const)}
                          label="Nombre del medicamento"
                          placeholder="Ej: Paracetamol"
                          error={errors.items?.[index]?.name?.message}
                        />

                        <Input
                          {...register(`items.${index}.dosage` as const)}
                          label="Dosis"
                          placeholder="Ej: 500mg"
                        />

                        <Input
                          {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                          type="number"
                          label="Cantidad"
                          placeholder="Ej: 30"
                        />

                        <Input
                          {...register(`items.${index}.instructions` as const)}
                          label="Instrucciones"
                          placeholder="Ej: Tomar cada 8 horas"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
              <Button type="submit" isLoading={isLoading}>
                Crear Receta
              </Button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}