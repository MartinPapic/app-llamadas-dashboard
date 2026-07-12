"use client";

import { useEffect, useState } from "react";
import { api, type AgentProgressResponse, type ProjectProgressResponse } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Briefcase, AlertTriangle, CheckCircle2, Users, FolderTree } from "lucide-react";

export default function AgentProgressPage() {
  const [activeTab, setActiveTab] = useState<"agentes" | "proyectos">("agentes");
  const [dataAgentes, setDataAgentes] = useState<AgentProgressResponse[]>([]);
  const [dataProyectos, setDataProyectos] = useState<ProjectProgressResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.agentProgress(),
      api.listProgress()
    ])
      .then(([resAgentes, resProyectos]) => {
        const sortedAgentes = resAgentes.sort((a, b) => a.agenteNombre.localeCompare(b.agenteNombre));
        const sortedProyectos = resProyectos.sort((a, b) => a.proyectoNombre.localeCompare(b.proyectoNombre));
        setDataAgentes(sortedAgentes);
        setDataProyectos(sortedProyectos);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-indigo-600" />
            Progreso de Asignaciones
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Monitorea la disponibilidad de las bolsas telefónicas por agente o por proyecto.
          </p>
        </div>
        
        {/* Custom Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-lg w-full md:w-auto">
          <button
            onClick={() => setActiveTab("agentes")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-md text-sm font-semibold transition-all ${
              activeTab === "agentes" 
                ? "bg-white text-indigo-700 shadow-sm" 
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            }`}
          >
            <Users className="w-4 h-4" />
            Por Agente
          </button>
          <button
            onClick={() => setActiveTab("proyectos")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-md text-sm font-semibold transition-all ${
              activeTab === "proyectos" 
                ? "bg-white text-indigo-700 shadow-sm" 
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            }`}
          >
            <FolderTree className="w-4 h-4" />
            Por Proyecto y Lista
          </button>
        </div>
      </div>

      {activeTab === "agentes" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {dataAgentes.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl">
              <p className="text-slate-500 font-medium">No hay agentes con asignaciones activas.</p>
            </div>
          ) : (
            dataAgentes.map((agente) => (
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
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {dataProyectos.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl">
              <p className="text-slate-500 font-medium">No hay proyectos con datos de progreso disponibles.</p>
            </div>
          ) : (
            dataProyectos.map((proyecto, pIdx) => (
              <Card key={pIdx} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                  <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                    <FolderTree className="w-5 h-5 text-indigo-500" />
                    <span className="truncate" title={proyecto.proyectoNombre}>{proyecto.proyectoNombre}</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Listas activas: {proyecto.listas.length}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 p-0">
                  {proyecto.listas.length === 0 ? (
                    <div className="p-4 text-sm text-slate-400 text-center italic">
                      Sin listas configuradas
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {proyecto.listas.map((lista, lIdx) => {
                        const completado = lista.pendientes === 0 && lista.enGestion === 0;
                        const agotado = !completado && lista.pendientes === 0;
                        const muchosAtrapados = lista.enGestion > 10;
                        const porcentajeAvance = lista.totalContactos > 0 
                          ? ((lista.totalContactos - lista.pendientes) / lista.totalContactos) * 100 
                          : 0;

                        return (
                          <li key={lIdx} className="p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-slate-700 text-sm truncate pr-2" title={lista.listaNombre}>
                                {lista.listaNombre}
                              </h4>
                              <div className="flex gap-2 shrink-0">
                                {completado && (
                                  <span className="shrink-0 inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Completada
                                  </span>
                                )}
                                {agotado && (
                                  <span className="shrink-0 inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full border border-red-200">
                                    <AlertTriangle className="w-3 h-3" />
                                    Bolsa Vacía
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 mt-3">
                              <div className={`p-2 rounded-lg border ${agotado ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'} text-center flex flex-col justify-center`}>
                                <p className={`text-[10px] font-bold uppercase mb-1 ${agotado ? 'text-red-500' : 'text-emerald-600'}`}>Bolsa Libre</p>
                                <p className={`text-xl font-bold ${agotado ? 'text-red-700' : 'text-emerald-700'}`}>
                                  {lista.pendientes}
                                </p>
                              </div>
                              <div className={`p-2 rounded-lg border ${muchosAtrapados ? 'bg-orange-50 border-orange-100' : 'bg-slate-50 border-slate-100'} text-center flex flex-col justify-center`}>
                                <p className={`text-[10px] font-bold uppercase mb-1 ${muchosAtrapados ? 'text-orange-600' : 'text-slate-500'}`}>Atrapados</p>
                                <p className={`text-xl font-bold ${muchosAtrapados ? 'text-orange-600' : 'text-slate-700'}`}>
                                  {lista.enGestion}
                                </p>
                              </div>
                              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center flex flex-col justify-center">
                                <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Total</p>
                                <p className="text-xl font-bold text-slate-700">
                                  {lista.totalContactos}
                                </p>
                              </div>
                            </div>
                            
                            {/* Barra de progreso general */}
                            <div className="mt-3">
                               <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                                  <div 
                                    className="h-1 rounded-full bg-indigo-500 transition-all duration-500" 
                                    style={{ width: `${porcentajeAvance}%` }}
                                  ></div>
                                </div>
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
      )}
    </div>
  );
}
