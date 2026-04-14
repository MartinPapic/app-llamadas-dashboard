"use client";

import { useEffect, useState, useMemo } from "react";
import { api, type Llamada } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Clock, AlertTriangle, CheckCircle2, Loader2, Users } from "lucide-react";

interface AgentStats {
  id: string;
  nombre: string;
  totalEmitidas: number;
  totalNoContesta: number;
  intentosCortos: number; // Anomalías (< 15s)
  indiceAnomalia: number; // Porcentaje
}

export default function AgentPerformancePage() {
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

    llamadas.forEach((llamada) => {
      let stats = statsMap.get(llamada.usuarioId);
      
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

      if (llamada.resultado === "NO_CONTESTA" || llamada.resultado === "OCUPADO" || llamada.resultado === "INVALIDO") {
        stats.totalNoContesta++;
        
        // Detección de "Llamada Fantasma" paramétrica < 15 segs
        if (llamada.duracion !== null && llamada.duracion < 15) {
          stats.intentosCortos++;
        }
      }
    });

    return Array.from(statsMap.values()).map((stats) => {
      if (stats.totalNoContesta > 0) {
        stats.indiceAnomalia = (stats.intentosCortos / stats.totalNoContesta) * 100;
      }
      return stats;
    }).sort((a, b) => b.indiceAnomalia - a.indiceAnomalia); 

  }, [agentes, llamadas]);

  const getRowStyles = (indice: number, totalNoContesta: number) => {
    if (totalNoContesta === 0) return "bg-white text-slate-700";
    if (indice > 20) return "bg-rose-50 hover:bg-rose-100 text-rose-900"; // Fraud risk
    if (indice <= 5) return "bg-emerald-50 hover:bg-emerald-100 text-emerald-900";
    return "bg-white hover:bg-slate-50 text-slate-700";
  };

  const getBadgeColors = (indice: number, totalNoContesta: number) => {
    if (totalNoContesta === 0) return "bg-slate-100 text-slate-600";
    if (indice > 20) return "bg-rose-100 text-rose-700 border-rose-300 shadow-sm";
    if (indice <= 5) return "bg-emerald-100 text-emerald-700 border-emerald-200";
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
          <Users className="w-8 h-8 text-indigo-600" />
          Productividad B2B (Agentes)
        </h1>
        <p className="text-slate-500 mt-2 text-lg">
          Análisis de esfuerzo, tiempo por llamada y auditoría de posibles marcaciones fraudulentas.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-8">
        <div className="p-5 bg-slate-50 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            Reporte de Calidad por Agente
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-sm border-b border-slate-200">
                <th className="py-4 px-6 font-semibold w-1/4">Agente</th>
                <th className="py-4 px-6 font-semibold text-right">Llamadas Emitidas</th>
                <th className="py-4 px-6 font-semibold text-right">Mala Calidad / Fallidas</th>
                <th className="py-4 px-6 font-semibold text-right text-rose-800">Fraude Corto (&lt; 15s)</th>
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
