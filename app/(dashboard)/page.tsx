"use client";

import { useEffect, useState } from "react";
import { api, type RealtimeMetrics } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, PhoneCall, CheckCircle2, XCircle, Clock, SearchX, AlertTriangle, Loader2, Users, Download } from "lucide-react";

export default function SupervisorRealtimePage() {
  const [metrics, setMetrics] = useState<RealtimeMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);

  const handleExport = async () => {
    try {
      setExportando(true);
      const data = await api.exportarDatos();
      if (!data || data.length === 0) {
        alert("No hay datos para exportar.");
        return;
      }
      
      const headers = [
        "Llamada ID", "Contacto ID", "Lista ID", "Referencia ID", 
        "Nombre Contacto", "Teléfono", "Fecha Llamada", "Duración (s)", 
        "Agente ID", "Email Agente", "Resultado", "Tipificación", 
        "Motivo", "Observación", "Intento Válido"
      ];
      
      const escapeCsv = (str: string | null | undefined) => {
        if (!str) return "";
        return `"${str.replace(/"/g, '""')}"`;
      };

      const csvContent = [
        headers.join(","),
        ...data.map(row => {
          const date = new Date(row.fechaLlamada).toISOString();
          return [
            row.llamadaId, row.contactoId, row.listaId || "", row.referenciaId || "",
            escapeCsv(row.nombreContacto), escapeCsv(row.telefonoContacto), date, row.duracion || 0,
            row.agenteId, row.emailAgente, row.resultado || "", escapeCsv(row.tipificacion),
            escapeCsv(row.motivo), escapeCsv(row.observacion), row.intentoValido ? "Sí" : "No"
          ].join(",");
        })
      ].join("\n");
      
      const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `exportacion_llamadas_${new Date().getTime()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Error al exportar los datos.");
    } finally {
      setExportando(false);
    }
  };

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
  const contesta = m.distribucionResultados["CONTACTADO_EFECTIVO"] || 0;
  const noEfectivo = m.distribucionResultados["CONTACTADO_NO_EFECTIVO"] || 0;
  const noContesta = m.distribucionResultados["NO_CONTACTADO"] || 0;

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
      <div className="flex justify-end">
        <button
          onClick={handleExport}
          disabled={exportando}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors disabled:opacity-50"
        >
          {exportando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          {exportando ? "Exportando..." : "Exportar Bitácora CSV"}
        </button>
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
            <p className="text-sm font-medium text-emerald-600 mt-1">Efectivas</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <Clock className="w-10 h-10 text-amber-500 mb-3" />
            <div className="text-3xl font-bold text-slate-800">{noEfectivo}</div>
            <p className="text-sm font-medium text-amber-600 mt-1">No Efectivas</p>
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
            <Users className="w-10 h-10 text-indigo-500 mb-3" />
            <div className="text-3xl font-bold text-slate-800">{m.totalAgentesActivos || 0}</div>
            <p className="text-sm font-medium text-indigo-600 mt-1">Agentes Activos</p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
