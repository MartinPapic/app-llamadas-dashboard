"use client";

import { useEffect, useState } from "react";
import { api, type Proyecto, type Metricas } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Target, Loader2, AlertTriangle, TrendingUp, Download } from "lucide-react";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";

interface ProyectoConMetricas extends Proyecto {
  metricas: Metricas | null;
  error?: string;
}

export default function AvanceMetasPage() {
  const [proyectos, setProyectos] = useState<ProyectoConMetricas[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  const exportToPDF = async () => {
    const element = document.getElementById("metas-report-content");
    if (!element) return;
    
    setExportingPdf(true);

    const btn = document.getElementById("export-btn");
    if (btn) btn.style.display = "none";

    const compactStyle = document.createElement("style");
    compactStyle.id = "pdf-metas-style";
    compactStyle.textContent = `
      #metas-report-content {
        margin: 0 !important;
        max-width: none !important;
        width: 1280px !important;
        padding: 32px !important;
      }
    `;
    document.head.appendChild(compactStyle);

    const mainEl = element.closest("main");
    const originalMainOverflow = mainEl ? (mainEl as HTMLElement).style.overflow : "";
    if (mainEl) (mainEl as HTMLElement).style.overflow = "visible";

    try {
      await new Promise(r => setTimeout(r, 400)); // Esperar repintado
      const expandedHeight = element.scrollHeight;

      const isMobile = window.innerWidth <= 768;
      
      const dataUrl = await htmlToImage.toPng(element, {
        pixelRatio: isMobile ? 1 : 2,
        backgroundColor: "#f8fafc",
        width: 1280,
        height: expandedHeight,
        style: {
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          width: "1280px",
          maxWidth: "1280px",
          margin: "0",
          boxSizing: "border-box"
        }
      });
      
      if (!dataUrl || dataUrl === "data:,") {
        throw new Error("La imagen se generó vacía. Posible límite de memoria del navegador.");
      }
      
      const img = new window.Image();
      await new Promise((resolve, reject) => { 
        img.onload = resolve; 
        img.onerror = () => reject(new Error("Fallo al decodificar la imagen generada"));
        img.src = dataUrl; 
      });
      
      const pdfWidth = 297; 
      const pdfHeight = (img.height * pdfWidth) / img.width;
      
      const pdf = new jsPDF("p", "mm", [pdfWidth, pdfHeight + 15]);
      
      const now = new Date();
      const fechaStr = `Generado el ${now.toLocaleDateString("es-CL")} a las ${now.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}`;
      
      pdf.setFontSize(10);
      pdf.setTextColor(120, 120, 120);
      pdf.text(fechaStr, 10, 10);
      
      pdf.addImage(dataUrl, "PNG", 0, 15, pdfWidth, pdfHeight);
      pdf.save("Avance_Metas.pdf");
      
    } catch (err: any) {
      console.error(err);
      alert("Error al exportar PDF");
    } finally {
      if (mainEl) (mainEl as HTMLElement).style.overflow = originalMainOverflow;
      const styleNode = document.getElementById("pdf-metas-style");
      if (styleNode) styleNode.remove();
      if (btn) btn.style.display = "flex";
      setExportingPdf(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const proyectosData = await api.proyectos();
        const activos = proyectosData.filter((p) => p.estado === "ACTIVO");
        
        // Cargar métricas para cada proyecto activo
        const conMetricas = await Promise.all(
          activos.map(async (proyecto) => {
            try {
              const metricas = await api.metricas(proyecto.id);
              return { ...proyecto, metricas };
            } catch (err) {
              return { ...proyecto, metricas: null, error: "Error al cargar métricas" };
            }
          })
        );
        
        setProyectos(conMetricas);
      } catch (err) {
        setGlobalError(err instanceof Error ? err.message : "Error al cargar proyectos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refrescar cada 30 segundos
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && proyectos.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (globalError) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl shadow-sm border border-red-200 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="font-medium">{globalError}</p>
        </div>
      </div>
    );
  }

  return (
    <div id="metas-report-content" className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <Target className="w-8 h-8 text-indigo-600" />
            Avance de Metas por Proyecto
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Monitoreo en tiempo real del progreso hacia el objetivo de gestiones exitosas en todos los proyectos activos.
          </p>
        </div>
        
        <button
          id="export-btn"
          onClick={exportToPDF}
          disabled={exportingPdf}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm disabled:opacity-50 shrink-0"
        >
          {exportingPdf ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
          ) : (
            <><Download className="w-4 h-4" /> Exportar PDF</>
          )}
        </button>
      </div>

      {proyectos.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 shadow-sm">
          No hay proyectos activos en este momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {proyectos.map((proyecto) => {
            const m = proyecto.metricas;
            const meta = m?.metaGestionesExitosas || 0;
            const actual = m?.totalGestionExitosa || 0;
            const porcentaje = meta > 0 ? Math.min((actual / meta) * 100, 100) : 0;
            const completado = meta > 0 && actual >= meta;

            return (
              <Card key={proyecto.id} className={`shadow-sm border-slate-200 relative overflow-hidden transition-all hover:shadow-md ${completado ? 'border-emerald-200 bg-emerald-50/30' : ''}`}>
                {completado && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10">
                    ¡Meta Alcanzada!
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl text-slate-800 line-clamp-1" title={proyecto.nombre}>
                    {proyecto.nombre}
                  </CardTitle>
                  <CardDescription className="text-slate-500 text-xs">
                    ID: {proyecto.id.slice(0, 8)}...
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {proyecto.error ? (
                    <div className="text-amber-600 text-sm flex items-center gap-2 mt-4 bg-amber-50 p-2 rounded">
                      <AlertTriangle className="w-4 h-4" /> {proyecto.error}
                    </div>
                  ) : !m ? (
                    <div className="text-slate-400 text-sm mt-4 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
                    </div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {/* Avance Principal */}
                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-sm font-semibold text-slate-700">Gestiones Exitosas</span>
                          <span className="text-2xl font-bold text-indigo-950">
                            {actual} <span className="text-sm font-normal text-slate-500">/ {meta > 0 ? meta : 'Sin meta'}</span>
                          </span>
                        </div>
                        
                        {meta > 0 ? (
                          <>
                            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                              <div 
                                className={`h-full transition-all duration-1000 ${completado ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                style={{ width: `${porcentaje}%` }}
                              />
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-[11px] font-medium text-slate-500">{porcentaje.toFixed(1)}% completado</span>
                              {meta - actual > 0 && (
                                <span className="text-[11px] font-medium text-amber-600">Faltan {meta - actual}</span>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="w-full bg-slate-100 h-3 rounded-full flex items-center justify-center border border-slate-200">
                            <span className="text-[10px] text-slate-400">Límite no configurado</span>
                          </div>
                        )}
                      </div>

                      {/* Mini Estadísticas */}
                      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                        <div>
                          <div className="text-[11px] text-slate-500 font-semibold uppercase">Contactabilidad</div>
                          <div className="text-lg font-bold text-slate-700">
                            {m.totalLlamadasValidas > 0 ? ((m.totalContestan / m.totalLlamadasValidas) * 100).toFixed(1) : 0}%
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-500 font-semibold uppercase">Total Emitidas</div>
                          <div className="text-lg font-bold text-slate-700">{m.totalLlamadasValidas}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
