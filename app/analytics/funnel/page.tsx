"use client";

import { useEffect, useState } from "react";
import { api, type FunnelMetrics } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, Database, AlertTriangle, Loader2 } from "lucide-react";

export default function FunnelPage() {
  const [metrics, setMetrics] = useState<FunnelMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.funnelMetrics()
      .then(setMetrics)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Error al cargar el embudo de campaña");
      })
      .finally(() => setLoading(false));
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
  const estados = m.estados || {};
  
  const pendientes = estados["PENDIENTE"] || 0;
  const enGestion = estados["EN_GESTION"] || 0;
  const contactados = estados["CONTACTADO"] || 0;
  const desistidos = estados["DESISTIDO"] || 0;

  const totalProcesados = contactados + desistidos;
  const conversionBruta = m.totalBase > 0 ? (contactados / m.totalBase) * 100 : 0;
  const avanceCampaña = m.totalBase > 0 ? (totalProcesados / m.totalBase) * 100 : 0;

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <Database className="w-8 h-8 text-indigo-600" />
          Salud y Embudo de Campaña
        </h1>
        <p className="text-slate-500 mt-2 text-lg">
          Auditoría de saturación de base de datos y conversión efectiva hasta el cierre de encuestas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-none shadow-md text-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400 font-semibold uppercase tracking-wider text-xs">Universo Total</CardDescription>
            <CardTitle className="text-4xl">{m.totalBase}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-slate-400">Dimensión total de la base</p>
          </CardContent>
        </Card>

        <Card className="bg-indigo-50 border-indigo-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-indigo-600 font-semibold uppercase tracking-wider text-xs">Avance Operativo</CardDescription>
            <CardTitle className="text-4xl text-indigo-800">{avanceCampaña.toFixed(1)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-indigo-700">Porcentaje de base cerrada (ya sea éxito o desistimiento)</p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-emerald-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-emerald-600 font-semibold uppercase tracking-wider text-xs">Conversión Bruta</CardDescription>
            <CardTitle className="text-4xl text-emerald-800">{conversionBruta.toFixed(1)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-emerald-700">Contactados vs Universo Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Visual Simplificado */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 mt-8">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
          Funnel de Transformación
        </h2>
        
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Nivel 1: Pendientes */}
          <div className="flex items-center gap-4">
            <div className="w-48 text-right font-medium text-slate-600">Base Fresca (Pendientes)</div>
            <div className="flex-1 bg-slate-100 rounded-lg overflow-hidden h-12 relative">
              <div 
                className="h-full bg-slate-400 transition-all duration-500 text-white flex items-center px-4 font-bold"
                style={{ width: `${Math.max(5, (pendientes / m.totalBase) * 100)}%` }}
              >
                {pendientes}
              </div>
            </div>
          </div>

          {/* Nivel 2: En Gestión */}
          <div className="flex items-center gap-4">
            <div className="w-48 text-right font-medium text-slate-600">En Tránsito (Gestión)</div>
            <div className="flex-1 bg-slate-100 rounded-lg overflow-hidden h-12 relative">
              <div 
                className="h-full bg-blue-500 transition-all duration-500 text-white flex items-center px-4 font-bold"
                style={{ width: `${Math.max(5, (enGestion / m.totalBase) * 100)}%` }}
              >
                {enGestion}
              </div>
            </div>
          </div>

          {/* Nivel 3: Éxito vs Fracaso */}
          <div className="flex flex-col md:flex-row gap-6 mt-8 pt-8 border-t border-slate-100">
            <div className="flex-1 bg-emerald-50 rounded-xl p-6 border border-emerald-100">
              <h3 className="text-emerald-800 font-bold mb-1">Conversión Exitosa</h3>
              <p className="text-sm text-emerald-600 mb-4">Meta cumplida (encuestas hechas o contacto logrado)</p>
              <div className="text-5xl font-extrabold text-emerald-600">{contactados}</div>
            </div>
            
            <div className="flex-1 bg-rose-50 rounded-xl p-6 border border-rose-100">
              <h3 className="text-rose-800 font-bold mb-1">Pérdida por Desistimiento</h3>
              <p className="text-sm text-rose-600 mb-4">Contactos quemados (límite de intentos sin éxito)</p>
              <div className="text-5xl font-extrabold text-rose-600">{desistidos}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
