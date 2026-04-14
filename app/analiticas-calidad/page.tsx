"use client";

import { useEffect, useState, useMemo } from "react";
import { api, type Llamada } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Clock, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

interface AgentStats {
  id: string;
  nombre: string;
  totalEmitidas: number;
  totalNoContesta: number;
  intentosCortos: number; // Anomalías (< 15s)
  indiceAnomalia: number; // Porcentaje
}

export default function AnaliticasCalidadPage() {
  const [agentes, setAgentes] = useState<Array<{ id: string; nombre: string; email: string }>>([]);
  const [llamadas, setLlamadas] = useState<Llamada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.agentes(), api.llamadas()])
      .then(([agentesData, llamadasData]) => {
        setAgentes(agentesData);
        setLlamadas(llamadasData);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Error al cargar datos analíticos");
      })
      .finally(() => setLoading(false));
  }, []);

  const metricasPorAgente = useMemo<AgentStats[]>(() => {
    if (agentes.length === 0 && llamadas.length === 0) return [];

    const statsMap = new Map<string, AgentStats>();

    // Inicializar mapa con agentes
    agentes.forEach((agente) => {
      statsMap.set(agente.id, {
        id: agente.id,
        nombre: agente.nombre,
        totalEmitidas: 0,
        totalNoContesta: 0,
        intentosCortos: 0,
        indiceAnomalia: 0,
      });
    });

    // Procesar iterativamente cada llamada
    llamadas.forEach((llamada) => {
      let stats = statsMap.get(llamada.usuarioId);
      
      // Si el usuario (ej. un admin o usuario eliminado) hizo llamadas pero no está en la lista de agentes
      if (!stats) {
        stats = {
          id: llamada.usuarioId,
          nombre: "Supervisor / Admin (Testing)",
          totalEmitidas: 0,
          totalNoContesta: 0,
          intentosCortos: 0,
          indiceAnomalia: 0,
        };
        statsMap.set(llamada.usuarioId, stats);
      }

      stats.totalEmitidas++;

      if (llamada.resultado === "NO_CONTESTA") {
        stats.totalNoContesta++;
        
        // REGLA ALGORÍTMICA: Llamada anómala (Intento Demasiado Rápido)
        if (llamada.duracion !== null && llamada.duracion < 15) {
          stats.intentosCortos++;
        }
      }
    });

    // Calcular índices finales y convertir a array
    return Array.from(statsMap.values()).map((stats) => {
      if (stats.totalNoContesta > 0) {
        stats.indiceAnomalia = (stats.intentosCortos / stats.totalNoContesta) * 100;
      }
      return stats;
    }).sort((a, b) => b.indiceAnomalia - a.indiceAnomalia); // Ordenar por índice de anomalía descendente

  }, [agentes, llamadas]);

  // UI Helpers para colores según regla de UX/UI
  const getRowStyles = (indice: number, totalNoContesta: number) => {
    if (totalNoContesta === 0) return "bg-white text-slate-700"; // Sin data

    if (indice > 25) {
      return "bg-amber-50 hover:bg-amber-100 text-amber-900"; // Advertencia pálida
    } else if (indice <= 5) {
      return "bg-emerald-50 hover:bg-emerald-100 text-emerald-900"; // Sano
    }
    return "bg-white hover:bg-slate-50 text-slate-700"; // Neutro
  };

  const getBadgeColors = (indice: number, totalNoContesta: number) => {
    if (totalNoContesta === 0) return "bg-slate-100 text-slate-600";

    if (indice > 25) {
      return "bg-amber-200 text-amber-800 border-amber-300";
    } else if (indice <= 5) {
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  if (loading) {
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

  const totalAnomaliasGlobales = metricasPorAgente.reduce((acc, curr) => acc + curr.intentosCortos, 0);

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <PieChart className="w-8 h-8 text-indigo-600" />
          Analíticas de Tiempos y Esfuerzo
        </h1>
        <p className="text-slate-500 mt-2 text-lg">
          Monitoreo corporativo de anomalías estadísticas y desempeño de telecomunicación.
        </p>
      </div>

      {/* Resumen Global */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 font-medium">Agentes Analizados</CardDescription>
            <CardTitle className="text-3xl text-slate-800">{metricasPorAgente.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 font-medium whitespace-nowrap">Intentos Rápidos Detectados (&lt; 15s)</CardDescription>
            <CardTitle className="text-3xl text-slate-800 flex items-center gap-2">
              {totalAnomaliasGlobales}
              {totalAnomaliasGlobales > 0 && <AlertTriangle className="w-5 h-5 text-amber-500" />}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 font-medium">Tiempos de Espera Sanos</CardDescription>
            <CardTitle className="text-3xl text-emerald-600 flex items-center gap-2">
              Verificando
              <CheckCircle2 className="w-6 h-6" />
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Corporate DataGrid */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 bg-slate-50 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            Reporte de Calidad por Agente
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Métricas calculadas bajo la regla de tolerancia operativa de red (&ge; 15 segundos).
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-sm border-b border-slate-200">
                <th className="py-4 px-6 font-semibold w-1/4">Agente</th>
                <th className="py-4 px-6 font-semibold text-right">Llamadas Emitidas</th>
                <th className="py-4 px-6 font-semibold text-right">Total "No Contesta"</th>
                <th className="py-4 px-6 font-semibold text-right text-indigo-800">Déficit de Tiempo (&lt; 15s)</th>
                <th className="py-4 px-6 font-semibold text-right">Índice de Anomalía</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metricasPorAgente.map((operador) => {
                const styles = getRowStyles(operador.indiceAnomalia, operador.totalNoContesta);
                const badgeStyles = getBadgeColors(operador.indiceAnomalia, operador.totalNoContesta);

                return (
                  <tr key={operador.id} className={`transition-colors ${styles}`}>
                    <td className="py-4 px-6">
                      <div className="font-medium">{operador.nombre}</div>
                      <div className="text-xs opacity-70 truncate max-w-[150px]" title={operador.id}>ID: ...{operador.id.slice(-6)}</div>
                    </td>
                    <td className="py-4 px-6 text-right font-medium opacity-80">
                      {operador.totalEmitidas}
                    </td>
                    <td className="py-4 px-6 text-right font-medium opacity-80">
                      {operador.totalNoContesta}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full font-bold border ${badgeStyles}`}>
                        {operador.intentosCortos}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-semibold">
                      {operador.totalNoContesta === 0 
                        ? <span className="text-slate-400">N/A</span> 
                        : `${operador.indiceAnomalia.toFixed(1)}%`}
                    </td>
                  </tr>
                );
              })}
              
              {metricasPorAgente.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No se encontraron agentes en la plataforma.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
