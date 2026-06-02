"use client";

import { useEffect, useState } from "react";
import { api, type Metricas, type Proyecto } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, PieChart, TrendingUp, PhoneCall, ShieldCheck, Info, Loader2, Filter, Download, Printer } from "lucide-react";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";

export default function GlobalPerformancePage() {
  const [metrics, setMetrics] = useState<Metricas | null>(null);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [selectedProyecto, setSelectedProyecto] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);

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

  const exportToPDF = async () => {
    const element = document.getElementById("report-content");
    if (!element) {
      alert("No se encontró el elemento contenedor para exportar.");
      return;
    }
    
    setExportingPdf(true);

    // Ocultar botones y filtro temporalmente
    const buttons = document.getElementById("export-buttons");
    const filterBox = document.getElementById("filter-container");
    if (buttons) buttons.style.display = "none";
    if (filterBox) filterBox.style.display = "none";

    // Expandir scrollbar temporalmente para capturar la lista completa
    const tipificacionesContainer = document.getElementById("tipificaciones-container");
    const oldOverflow = tipificacionesContainer?.style.overflow;
    const oldMaxHeight = tipificacionesContainer?.style.maxHeight;
    if (tipificacionesContainer) {
       tipificacionesContainer.style.overflow = "visible";
       tipificacionesContainer.style.maxHeight = "none";
    }

    // Inyectar estilos compactos temporales para que todo quepa en 1 página
    const compactStyle = document.createElement("style");
    compactStyle.id = "pdf-compact-style";
    compactStyle.textContent = `
      #report-content { padding: 24px 32px !important; gap: 16px !important; max-width: none !important; margin: 0 !important; }
      #report-content > div { gap: 12px !important; }
      #tipificaciones-container li { padding: 6px 16px !important; }
      #tipificaciones-container .h-1\\.5 { height: 3px !important; margin-top: 2px !important; }
      #report-content h1 { font-size: 1.5rem !important; }
      #report-content .text-lg { font-size: 0.85rem !important; }
      #report-content .grid { gap: 12px !important; }
      #report-content .mt-6 { margin-top: 12px !important; }
      #report-content .space-y-8 > * + * { margin-top: 12px !important; }
    `;
    document.head.appendChild(compactStyle);

    // Ocultar scrollbar del contenedor padre para evitar asimetría de márgenes
    const mainEl = element.closest("main");
    if (mainEl) (mainEl as HTMLElement).style.overflow = "hidden";
    
    // Guardar estado original
    const originalWidth = element.style.width;
    const originalOverflow = element.style.overflow;
    
    // Forzar layout en el DOM real para que html-to-image lo copie sin recortes
    element.style.width = "1600px";
    element.style.overflow = "hidden";

    try {
      // Esperar repintado del DOM tras forzar 1600px
      await new Promise(r => setTimeout(r, 300));
      const expandedHeight = element.scrollHeight;

      const CAPTURE_WIDTH = 1600;
      const dataUrl = await htmlToImage.toPng(element, {
        pixelRatio: 2,
        backgroundColor: "#f8fafc",
        width: CAPTURE_WIDTH,
        height: expandedHeight,
        style: {
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          width: `${CAPTURE_WIDTH}px`,
          maxWidth: "none",
          boxSizing: "border-box"
        }
      });
      
      // Landscape A4
      const pdf = new jsPDF("l", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const headerHeight = 6; // espacio para el encabezado con fecha
      const usableWidth = pageWidth - 2 * margin;
      const usableHeight = pageHeight - 2 * margin - headerHeight;

      // Cargar la imagen capturada
      const img = new window.Image();
      img.src = dataUrl;
      await new Promise((resolve) => { img.onload = resolve; });
      const totalScaledHeight = (img.height * usableWidth) / img.width;

      // Fecha, hora y proyecto del reporte
      const now = new Date();
      const proyectoNombre = selectedProyecto
        ? proyectos.find(p => p.id === selectedProyecto)?.nombre || "Proyecto"
        : "Todos los Proyectos";
      const fechaStr = `Generado el ${now.toLocaleDateString("es-CL")} a las ${now.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}`;

      // Multi-página: si el contenido es más alto que la hoja, dividir
      if (totalScaledHeight <= usableHeight) {
        // Cabe en una sola página
        pdf.setFontSize(8);
        pdf.setTextColor(120, 120, 120);
        pdf.text(fechaStr, pageWidth - margin, margin + 3, { align: "right" });
        pdf.text(`Proyecto: ${proyectoNombre}`, margin, margin + 3);
        pdf.addImage(dataUrl, "PNG", margin, margin + headerHeight, usableWidth, totalScaledHeight);
      } else {
        // Multi-página
        let yOffset = 0;
        let pageNum = 0;
        const sourceRatio = img.width / usableWidth; // px por mm

        while (yOffset < totalScaledHeight) {
          if (pageNum > 0) pdf.addPage();
          pageNum++;

          // Encabezado con fecha en cada página
          pdf.setFontSize(8);
          pdf.setTextColor(120, 120, 120);
          pdf.text(fechaStr, pageWidth - margin, margin + 3, { align: "right" });
          pdf.text(`Proyecto: ${proyectoNombre} — Página ${pageNum}`, margin, margin + 3);

          // Calcular qué porción de la imagen cortar
          const sliceHeightMm = Math.min(usableHeight, totalScaledHeight - yOffset);
          const srcY = yOffset * sourceRatio;
          const srcH = sliceHeightMm * sourceRatio;

          // Crear canvas temporal con la porción de imagen correspondiente
          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = img.width;
          sliceCanvas.height = Math.ceil(srcH);
          const ctx = sliceCanvas.getContext("2d")!;
          ctx.drawImage(img, 0, Math.floor(srcY), img.width, Math.ceil(srcH), 0, 0, img.width, Math.ceil(srcH));

          const sliceData = sliceCanvas.toDataURL("image/png");
          pdf.addImage(sliceData, "PNG", margin, margin + headerHeight, usableWidth, sliceHeightMm);

          yOffset += usableHeight;
        }
      }

      pdf.save("Reporte_Rendimiento.pdf");
    } catch (err: any) {
      console.error("Error exporting PDF:", err);
      alert("Error al exportar PDF: " + (err?.message || err || "Error desconocido"));
    } finally {
      compactStyle.remove();
      if (mainEl) (mainEl as HTMLElement).style.overflow = "";
      element.style.width = originalWidth;
      element.style.overflow = originalOverflow;
      if (buttons) buttons.style.display = "flex";
      if (filterBox) filterBox.style.display = "";
      if (tipificacionesContainer) {
         tipificacionesContainer.style.overflow = oldOverflow || "";
         tipificacionesContainer.style.maxHeight = oldMaxHeight || "";
      }
      setExportingPdf(false);
    }
  };

  return (
    <div id="report-content" className="max-w-6xl mx-auto p-8 space-y-8 print:p-0 print:m-0 print:max-w-none print:w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-indigo-600 print:text-black" />
            Rendimiento Operativo Histórico
          </h1>
          <p className="text-slate-500 mt-2 text-lg print:text-black">
            Resumen acumulado de efectividad, validación de tráfico y desglose de categorización de clientes.
          </p>
        </div>
        
        {/* Export Buttons */}
        <div id="export-buttons" className="flex items-center gap-2 print:hidden">
          <button 
            onClick={exportToPDF}
            disabled={exportingPdf}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm disabled:opacity-50"
          >
            {exportingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> PDF Visual
              </>
            )}
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm font-medium text-sm"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
        </div>
      </div>

      {/* Filtrado */}
      <div id="filter-container" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 w-full md:w-96 print:hidden">
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
        
        {/* KPI: Tasa Contactabilidad */}
        <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg border-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-emerald-100 font-semibold uppercase tracking-wider text-xs flex items-center gap-1">
              <ShieldCheck className="w-4 h-4"/> % Contactabilidad
            </CardDescription>
            <CardTitle className="text-5xl font-extrabold tracking-tight">
              {Number(metrics?.totalLlamadasValidas || 0) > 0 
                ? ((Number(metrics?.totalContestan || 0) / Number(metrics?.totalLlamadasValidas || 1)) * 100).toFixed(1) 
                : "0.0"}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-emerald-50 text-sm opacity-90">Porcentaje de clientes que contestaron el teléfono.</p>
          </CardContent>
        </Card>

        {/* KPI: Tasa Contestabilidad (Gestiones Exitosas) */}
        <Card className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-lg border-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-indigo-100 font-semibold uppercase tracking-wider text-xs flex items-center gap-1">
              <ShieldCheck className="w-4 h-4"/> % Contestabilidad
            </CardDescription>
            <CardTitle className="text-5xl font-extrabold tracking-tight">
              {Number(metrics?.totalContestan || 0) > 0 
                ? ((Number(metrics?.totalGestionExitosa || 0) / Number(metrics?.totalContestan || 1)) * 100).toFixed(1) 
                : "0.0"}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-indigo-50 text-sm opacity-90 mb-3">
              Encuestas respondidas ({metrics?.totalGestionExitosa || 0}) sobre llamadas contestadas.
            </p>
            {/* Meta Progress */}
            {metrics?.metaGestionesExitosas ? (
              <div className="mt-2">
                <div className="flex justify-between text-xs font-semibold text-indigo-100 mb-1">
                  <span>Avance hacia la Meta</span>
                  <span>{metrics.totalGestionExitosa} / {metrics.metaGestionesExitosas}</span>
                </div>
                <div className="w-full bg-indigo-900/50 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-300 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min((metrics.totalGestionExitosa / metrics.metaGestionesExitosas) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="text-right text-[10px] text-indigo-200 mt-1">
                  {((metrics.totalGestionExitosa / metrics.metaGestionesExitosas) * 100).toFixed(1)}% de la meta alcanzada
                </div>
              </div>
            ) : null}
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
          <CardContent id="tipificaciones-container" className="p-0 flex-1 overflow-y-auto max-h-[500px]">
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
                  <div className="text-sm font-bold text-slate-800">Atención Efectiva</div>
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
                   <p className="text-xs opacity-80 mt-1">Solo se consideran "Intentos Válidos" las marcaciones únicas diarias por registro.</p>
                 </div>
              </div>

           </CardContent>
        </Card>
      </div>
    </div>
  );
}
