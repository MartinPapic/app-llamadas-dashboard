"use client";

import { useEffect, useState } from "react";
import { api, type RealtimeMetrics } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, PhoneCall, CheckCircle2, XCircle, Clock, SearchX, AlertTriangle, Loader2 } from "lucide-react";

export default function SupervisorRealtimePage() {
  const [metrics, setMetrics] = useState<RealtimeMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRealtime = () => {
    api.realtimeMetrics()
      .then(setMetrics)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Error al obtener métricas en vivo");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRealtime();
    // Refrescar cada 15 segundos simulando "tiempo real"
    const interval = setInterval(fetchRealtime, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !metrics) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl shadow-sm border border-red-200 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const m = metrics!;
  const contesta = m.distribucionResultados["CONTESTA"] || 0;
  const noContesta = m.distribucionResultados["NO_CONTESTA"] || 0;
  const ocupado = m.distribucionResultados["OCUPADO"] || 0;
  const invalido = m.distribucionResultados["INVALIDO"] || 0;

  const contactabilidadOk = m.tasaContactabilidadDiaria > 15.0;

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <Activity className="w-8 h-8 text-indigo-600 animate-pulse" />
          Control Operativo (En Vivo)
        </h1>
        <p className="text-slate-500 mt-2 text-lg">
          Monitoreo de tráfico, contactabilidad y desempeño del Call Center en la jornada actual.
        </p>
      </div>

      {/* KPI Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-white border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <PhoneCall className="w-24 h-24 text-slate-900" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 font-semibold uppercase tracking-wider text-xs">Tráfico Emitido</CardDescription>
            <CardTitle className="text-5xl text-slate-800 font-extrabold">{m.llamadasEmitidasHoy}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-slate-500">Llamadas totales procesadas hoy</p>
          </CardContent>
        </Card>

        <Card className={`border shadow-sm relative overflow-hidden ${contactabilidadOk ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity className="w-24 h-24 text-slate-900" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className={`font-semibold uppercase tracking-wider text-xs ${contactabilidadOk ? 'text-emerald-700' : 'text-amber-700'}`}>
              Contactabilidad Efectiva
            </CardDescription>
            <CardTitle className={`text-5xl font-extrabold ${contactabilidadOk ? 'text-emerald-700' : 'text-amber-700'}`}>
              {m.tasaContactabilidadDiaria.toFixed(1)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm font-medium ${contactabilidadOk ? 'text-emerald-600' : 'text-amber-600'}`}>
              {contactabilidadOk ? 'Dentro del margen saludable (>15%)' : 'Alerta: Por debajo del rendimiento esperado (<15%)'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribución de Resultados */}
      <h2 className="text-xl font-bold text-slate-800 mt-10 mb-4 border-b pb-2">Distribución de Tráfico (Estados de Llamada)</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
            <div className="text-3xl font-bold text-slate-800">{contesta}</div>
            <p className="text-sm font-medium text-emerald-600 mt-1">Conectadas</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <XCircle className="w-10 h-10 text-rose-500 mb-3" />
            <div className="text-3xl font-bold text-slate-800">{noContesta}</div>
            <p className="text-sm font-medium text-rose-600 mt-1">No Contestan</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <Clock className="w-10 h-10 text-amber-500 mb-3" />
            <div className="text-3xl font-bold text-slate-800">{ocupado}</div>
            <p className="text-sm font-medium text-amber-600 mt-1">Ocupados</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <SearchX className="w-10 h-10 text-slate-400 mb-3" />
            <div className="text-3xl font-bold text-slate-800">{invalido}</div>
            <p className="text-sm font-medium text-slate-500 mt-1">Inválidos</p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
