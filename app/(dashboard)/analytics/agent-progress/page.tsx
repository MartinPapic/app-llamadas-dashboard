"use client";

import { useEffect, useState } from "react";
import { api, type AgentProgressResponse } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Briefcase, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function AgentProgressPage() {
  const [data, setData] = useState<AgentProgressResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.agentProgress()
      .then((res) => {
        // Ordenar alfabéticamente por nombre de agente
        const sorted = res.sort((a, b) => a.agenteNombre.localeCompare(b.agenteNombre));
        setData(sorted);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Error al cargar progreso de asignaciones");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
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

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <Briefcase className="w-8 h-8 text-indigo-600" />
          Progreso de Asignaciones
        </h1>
        <p className="text-slate-500 mt-2 text-lg">
          Monitorea en tiempo real cuántos contactos disponibles (Bolsa Libre) le quedan a cada agente en sus listas asignadas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
        {data.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl">
            <p className="text-slate-500 font-medium">No hay agentes con asignaciones activas.</p>
          </div>
        ) : (
          data.map((agente) => (
            <Card key={agente.agenteId} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold shrink-0">
                    {agente.agenteNombre.charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate" title={agente.agenteNombre}>{agente.agenteNombre}</span>
                </CardTitle>
                <CardDescription className="text-xs truncate">
                  ID: {agente.agenteId}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 p-0">
                {agente.listas.length === 0 ? (
                  <div className="p-4 text-sm text-slate-400 text-center italic">
                    Sin listas asignadas
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {agente.listas.map((lista) => {
                      const agotado = lista.totalPendientes === 0;
                      const porcentajePendiente = lista.totalAsignado > 0 
                        ? (lista.totalPendientes / lista.totalAsignado) * 100 
                        : 0;

                      return (
                        <li key={lista.listaId} className="p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-slate-700 text-sm truncate pr-2" title={lista.listaNombre}>
                              {lista.listaNombre}
                            </h4>
                            {agotado ? (
                              <span className="shrink-0 inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full border border-red-200">
                                <AlertTriangle className="w-3 h-3" />
                                Agotada
                              </span>
                            ) : (
                              <span className="shrink-0 inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                Activa
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-3">
                            <div className="bg-slate-100/50 p-2 rounded-lg text-center">
                              <p className="text-xs text-slate-500 font-medium mb-1">Bolsa Libre</p>
                              <p className={`text-xl font-bold ${agotado ? 'text-red-600' : 'text-indigo-600'}`}>
                                {lista.totalPendientes}
                              </p>
                            </div>
                            <div className="bg-slate-100/50 p-2 rounded-lg text-center">
                              <p className="text-xs text-slate-500 font-medium mb-1">Total Lista</p>
                              <p className="text-xl font-bold text-slate-700">
                                {lista.totalAsignado}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3">
                            <div className="flex justify-between text-xs font-medium text-slate-500 mb-1">
                              <span>Consumo de la Lista</span>
                              <span>{Math.round(100 - porcentajePendiente)}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-1.5 rounded-full transition-all duration-500 ${agotado ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                style={{ width: `${100 - porcentajePendiente}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="mt-3 text-xs text-slate-500 flex justify-between items-center bg-indigo-50/50 p-2 rounded border border-indigo-100/50">
                            <span>Gestionados por este Agente:</span>
                            <span className="font-bold text-indigo-700">{lista.totalGestionadosPorEsteAgente}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
