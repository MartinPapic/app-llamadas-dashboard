"use client";

import { useEffect, useState } from "react";
import { api, type Metricas, type Proyecto } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, PieChart, TrendingUp, PhoneCall, ShieldCheck, Info, Loader2, Filter } from "lucide-react";

export default function GlobalPerformancePage() {
  const [metrics, setMetrics] = useState<Metricas | null>(null);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [selectedProyecto, setSelectedProyecto] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.proyectos().then(setProyectos).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    api.metricas(selectedProyecto || undefined)
      .then(setMetrics)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Error al cargar métricas globales");
      })
      .finally(() => setLoading(false));
  }, [selectedProyecto]);

  if (loading && !metrics) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 text-red-800 rounded-xl border border-red-200 m-6">
        {error}
      </div>
    );
  }

  const tipificacionesFormatted = Object.entries(metrics?.distribucionTipificaciones || {})
    .map(([nombre, porcentaje]) => ({ nombre, porcentaje }))
    .sort((a, b) => b.porcentaje - a.porcentaje);

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-indigo-600" />
          Rendimiento Operativo Histórico
        </h1>
        <p className="text-slate-500 mt-2 text-lg">
          Resumen acumulado de efectividad, validación de tráfico y desglose de categorización de clientes.
        </p>
      </div>

      {/* Filtrado */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 w-full md:w-96">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          className="flex-1 bg-transparent text-sm border-none focus:ring-0 outline-none"
          value={selectedProyecto}
          onChange={(e) => setSelectedProyecto(e.target.value)}
        >
          <option value="">Todos los Proyectos</option>
          {proyectos.map(p => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
      </div>

      {/* Top Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* KPI: Tasa Contacto Efectivo */}
        <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg border-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-emerald-100 font-semibold uppercase tracking-wider text-xs flex items-center gap-1">
              <ShieldCheck className="w-4 h-4"/> % Contactabilidad Efectiva
            </CardDescription>
            <CardTitle className="text-5xl font-extrabold tracking-tight">
              {Number(metrics?.tasaContacto || 0).toFixed(1)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-emerald-50 text-sm opacity-90">De todas las llamadas con intentos válidos.</p>
          </CardContent>
        </Card>

        {/* KPI: Gestiones Exitosas */}
        <Card className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-lg border-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-indigo-100 font-semibold uppercase tracking-wider text-xs flex items-center gap-1">
              <ShieldCheck className="w-4 h-4"/> Gestiones Exitosas
            </CardDescription>
            <CardTitle className="text-5xl font-extrabold tracking-tight">
              {Number(metrics?.totalGestionExitosa || 0).toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-indigo-50 text-sm opacity-90">Encuestas completadas con éxito.</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 font-semibold text-xs uppercase">Llamadas Emitidas</CardDescription>
            <CardTitle className="text-3xl text-slate-800">{Number(metrics?.totalLlamadasValidas || 0).toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-slate-500 mt-1">
              <span className="font-bold text-indigo-600">{metrics?.totalContestan || 0}</span> atendieron la llamada
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 font-semibold text-xs uppercase">Tiempo Promedio Hablado</CardDescription>
            <CardTitle className="text-3xl text-slate-800">{Number(metrics?.duracionPromedio || 0).toFixed(0)}s</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-500 text-xs">Segundos reales de conversación detectada por llamada.</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Sections Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        
        {/* Distribución de Tipificación (%) */}
        <Card className="shadow-sm border-slate-200 flex flex-col h-full">
          <CardHeader className="border-b border-slate-50">
            <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-500" /> Desglose de Tipificaciones
            </CardTitle>
            <CardDescription>Proporción que representa cada motivo sobre la base total de tráfico emitido.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto max-h-[500px]">
            {tipificacionesFormatted.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No hay tipificaciones registradas aún.</div>
            ) : (
              <ul className="divide-y divide-slate-50">
                {tipificacionesFormatted.map((item, idx) => (
                  <li key={idx} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-medium text-slate-700 text-sm">{item.nombre}</div>
                      {/* Tiny bar visualizer */}
                      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-indigo-500 h-full" style={{ width: `${item.porcentaje}%` }}></div>
                      </div>
                    </div>
                    <div className="text-right w-16 shrink-0 font-bold text-indigo-950">
                      {item.porcentaje.toFixed(1)}%
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Distribución Binaria o Resumen Visual de Volume */}
        <Card className="shadow-sm border-slate-200 h-fit">
           <CardHeader>
              <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-teal-500"/> Volumen y Salida de Llamada
              </CardTitle>
           </CardHeader>
           <CardContent className="space-y-6 py-4">
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                   {(Number(metrics?.totalLlamadasValidas || 0) > 0 ? (Number(metrics?.totalContestan || 0) / Number(metrics?.totalLlamadasValidas || 1) * 100) : 0).toFixed(0)}%
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">Atención Efectiva (RPC)</div>
                  <div className="text-xs text-slate-500">Clientes que tomaron el teléfono del agente vs disparos totales realizados al marcador.</div>
                </div>
              </div>

              <div className="pt-2">
                 <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2 px-1">
                   <span>Contestan ({metrics?.totalContestan || 0})</span>
                   <span>No Contestan ({metrics?.totalNoContestan || 0})</span>
                 </div>
                 <div className="w-full flex h-10 rounded-xl overflow-hidden border border-white shadow-sm">
                    <div className="bg-emerald-500 flex items-center justify-center text-white font-bold text-sm h-full" 
                         style={{ width: `${Number(metrics?.totalLlamadasValidas || 0) > 0 ? (Number(metrics?.totalContestan || 0) / Number(metrics?.totalLlamadasValidas || 1) * 100) : 50}%` }}>
                         {Number(metrics?.totalLlamadasValidas || 0) > 0 ? (Number(metrics?.totalContestan || 0) / Number(metrics?.totalLlamadasValidas || 1) * 100).toFixed(0) : "-"}%
                    </div>
                    <div className="bg-rose-500 flex items-center justify-center text-white font-bold text-sm h-full" 
                         style={{ width: `${Number(metrics?.totalLlamadasValidas || 0) > 0 ? (Number(metrics?.totalNoContestan || 0) / Number(metrics?.totalLlamadasValidas || 1) * 100) : 50}%` }}>
                         {Number(metrics?.totalLlamadasValidas || 0) > 0 ? (Number(metrics?.totalNoContestan || 0) / Number(metrics?.totalLlamadasValidas || 1) * 100).toFixed(0) : "-"}%
                    </div>
                 </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 flex gap-3 text-sm items-start mt-4">
                 <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                 <div>
                   <p className="font-semibold">Regla de Calidad Vigente:</p>
                   <p className="text-xs opacity-80 mt-1">Solo se consideran "Intentos Válidos" las marcaciones únicas diarias por registro y las que superaron el filtro anti-fraude.</p>
                 </div>
              </div>

           </CardContent>
        </Card>
      </div>
    </div>
  );
}
