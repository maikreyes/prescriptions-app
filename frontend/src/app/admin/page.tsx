"use client";

import { useState, useEffect, useCallback } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, PageLoading, ErrorState } from "@/components/ui";
import api from "@/lib/api";
import { Metrics, Prescription, PaginatedResponse } from "@/types";
import { Users, UserCog, FileText, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

interface DailyData {
  date: string;
  count: number;
}

interface StatusData {
  name: string;
  value: number;
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [metricsRes, prescriptionsRes] = await Promise.all([
        api.get<Metrics>("/admin/metrics"),
        api.get<PaginatedResponse<Prescription>>(
          "/admin/prescriptions?limit=100",
        ),
      ]);

      setMetrics(metricsRes.data);
      setPrescriptions(prescriptionsRes.data.data);

      const statusCounts = prescriptionsRes.data.data.reduce(
        (acc, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      setStatusData([
        { name: "Pendientes", value: statusCounts.pending || 0 },
        { name: "Consumidas", value: statusCounts.consumed || 0 },
      ]);

      const last30Days: Record<string, number> = {};
      const today = new Date();

      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        last30Days[dateStr] = 0;
      }

      prescriptionsRes.data.data.forEach((p) => {
        const dateStr = new Date(p.createdAt).toISOString().split("T")[0];
        if (last30Days[dateStr] !== undefined) {
          last30Days[dateStr]++;
        }
      });

      setDailyData(
        Object.entries(last30Days).map(([date, count]) => ({
          date: new Date(date).toLocaleDateString("es-CO", {
            month: "short",
            day: "numeric",
          }),
          count,
        })),
      );
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["admin"]}>
        <DashboardLayout>
          <PageLoading />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute allowedRoles={["admin"]}>
        <DashboardLayout>
          <ErrorState error={error} reset={fetchData} />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <UserCog className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Doctores</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics?.totals.doctors || 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pacientes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics?.totals.patients || 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Recetas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics?.totals.prescriptions || 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Consumidas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statusData.find((s) => s.name === "Consumidas")?.value ||
                      0}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Recetas por Estado
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {statusData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Recetas por Día (Últimos 30 días)
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={{ fill: "#3B82F6" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Recetas Recientes
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Código
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Doctor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Paciente
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {prescriptions.slice(0, 10).map((prescription) => (
                      <tr key={prescription.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">
                          {prescription.code}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {prescription.author.user.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {prescription.patient.user.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(prescription.createdAt).toLocaleDateString(
                            "es-CO",
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              prescription.status === "consumed"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {prescription.status === "consumed"
                              ? "Consumida"
                              : "Pendiente"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
