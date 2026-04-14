"use client";

import { useEffect, useState } from "react";
import { api, type Metricas, type Llamada } from "@/lib/api";
import { MetricCard } from "@/components/MetricCard";
import { LlamadasChart } from "@/components/LlamadasChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Users, CheckCircle, XCircle, Clock, TrendingUp, Loader2 } from "lucide-react";

const MOCK_METRICAS: Metricas = {
  totalContactos: 0,
  totalLlamadas: 0,
  totalContestan: 0,
  totalNoContestan: 0,
  duracionPromedio: 0,
  tasaContacto: 0,
};

export default function DashboardPage() {
  const [metricas, setMetricas] = useState<Metricas>(MOCK_METRICAS);
  const [llamadas, setLlamadas] = useState<Llamada[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [m, l] = await Promise.all([api.metricas(), api.llamadas()]);
        setMetricas(m);
        setLlamadas(l);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error al cargar datos");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Resumen general de gestión de llamadas
        </p>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            <MetricCard title="Total Contactos"   value={metricas.totalContactos}                        icon={Users}       colorClass="text-blue-600"    bgClass="bg-blue-50" />
            <MetricCard title="Total Llamadas"    value={metricas.totalLlamadas}                         icon={Phone}       colorClass="text-indigo-600"  bgClass="bg-indigo-50" />
            <MetricCard title="Contestaron"       value={metricas.totalContestan}                        icon={CheckCircle} colorClass="text-green-600"   bgClass="bg-green-50" />
            <MetricCard title="No Contestaron"    value={metricas.totalNoContestan}                      icon={XCircle}     colorClass="text-red-500"     bgClass="bg-red-50" />
            <MetricCard title="Tasa de Contacto"  value={`${metricas.tasaContacto.toFixed(1)}%`}         icon={TrendingUp}  colorClass="text-emerald-600" bgClass="bg-emerald-50" subtitle="Sobre total de llamadas" />
            <MetricCard title="Duración Promedio" value={`${Math.round(metricas.duracionPromedio)}s`}    icon={Clock}       colorClass="text-orange-500"  bgClass="bg-orange-50" subtitle="Por llamada contestada" />
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribución de resultados</CardTitle>
            </CardHeader>
            <CardContent>
              <LlamadasChart llamadas={llamadas} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
