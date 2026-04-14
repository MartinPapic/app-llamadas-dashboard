"use client";

import { useEffect, useState } from "react";
import { api, type Encuesta, type Contacto } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ClipboardList, ExternalLink, Loader2, AlertTriangle, Calendar } from "lucide-react";

export default function EncuestasPage() {
  const [encuestas, setEncuestas] = useState<Encuesta[]>([]);
  const [contactos, setContactos] = useState<Map<string, Contacto>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.encuestas(), api.contactos()])
      .then(([encuestasData, contactosData]) => {
        setEncuestas(encuestasData);
        // Crear un mapa de contactos para búsqueda rápida $O(1)$
        const contactsMap = new Map();
        contactosData.forEach((c) => contactsMap.set(c.id, c));
        setContactos(contactsMap);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Error al cargar las encuestas");
      })
      .finally(() => setLoading(false));
  }, []);

  const getEstadoBadge = (estado: string) => {
    switch (estado.toUpperCase()) {
      case "COMPLETA":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "INCOMPLETA":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "NO_REALIZADA":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado.toUpperCase()) {
      case "COMPLETA": return "Completada";
      case "INCOMPLETA": return "Incompleta";
      case "NO_REALIZADA": return "No Realizada";
      default: return estado;
    }
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

  // Ordenar encuestas: las más recientes primero
  const encuestasOrdenadas = [...encuestas].sort((a, b) => b.fecha - a.fecha);

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <ClipboardList className="w-8 h-8 text-indigo-600" />
          Estado de Encuestas
        </h1>
        <p className="text-slate-500 mt-2 text-lg">
          Monitoreo de satisfacción y estatus de encuestas procesadas por los agentes.
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="text-4xl font-bold text-slate-800">{encuestas.length}</div>
            <p className="text-sm font-medium text-slate-500 mt-1">Total Registradas</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-100 shadow-sm">
          <CardContent className="pt-6">
            <div className="text-4xl font-bold text-emerald-700">
              {encuestas.filter(e => e.estado.toUpperCase() === "COMPLETA").length}
            </div>
            <p className="text-sm font-medium text-emerald-600 mt-1">Completadas</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-100 shadow-sm">
          <CardContent className="pt-6">
            <div className="text-4xl font-bold text-amber-700">
              {encuestas.filter(e => e.estado.toUpperCase() === "INCOMPLETA").length}
            </div>
            <p className="text-sm font-medium text-amber-600 mt-1">Incompletas</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="text-4xl font-bold text-slate-700">
              {encuestas.filter(e => e.estado.toUpperCase() === "NO_REALIZADA").length}
            </div>
            <p className="text-sm font-medium text-slate-500 mt-1">No Realizadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 bg-slate-50 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            Registro Detallado
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-sm border-b border-slate-200">
                <th className="py-4 px-6 font-semibold">Contacto (Nombre)</th>
                <th className="py-4 px-6 font-semibold">Estado</th>
                <th className="py-4 px-6 font-semibold">Fecha de Gestión</th>
                <th className="py-4 px-6 font-semibold text-right">Enlace / ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {encuestasOrdenadas.map((encuesta) => {
                const contacto = contactos.get(encuesta.contactoId);
                const fechaLegible = new Date(encuesta.fecha).toLocaleString('es-ES', {
                  day: '2-digit', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                });

                return (
                  <tr key={encuesta.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-900">
                        {contacto ? contacto.nombre : "Contacto Desconocido"}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5" title={encuesta.contactoId}>
                        ID: ...{encuesta.contactoId.slice(-8)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getEstadoBadge(encuesta.estado)}`}>
                        {getEstadoLabel(encuesta.estado)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-slate-600 text-sm">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {fechaLegible}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {encuesta.url && encuesta.url.startsWith("http") ? (
                        <a 
                          href={encuesta.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 hover:underline text-sm font-medium transition-colors"
                        >
                          Ver original
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <div className="text-xs font-mono text-slate-400" title="Reference ID">
                          {encuesta.url || "Sin enlace"}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {encuestasOrdenadas.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-slate-900">Sin encuestas</h3>
                    <p className="text-slate-500 mt-1">No se ha registrado ninguna respuesta aún.</p>
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
