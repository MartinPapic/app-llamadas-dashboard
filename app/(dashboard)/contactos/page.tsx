"use client";

import { useEffect, useState } from "react";
import { api, type Contacto, type Proyecto, type FunnelMetrics } from "@/lib/api";
import { ContactosTable } from "@/components/ContactosTable";
import { UploadCSV } from "@/components/UploadCSV";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function ContactosPage() {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [filtroProyecto, setFiltroProyecto] = useState<string>("");
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Paginación y Métricas Globales
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [funnel, setFunnel] = useState<FunnelMetrics | null>(null);

  const fetchContactos = () => {
    setLoading(true);
    api.contactos(page, 100, filtroProyecto || undefined, filtroEstado || undefined)
      .then((res) => {
        setContactos(res.content);
        setTotalPages(res.totalPages);
        setTotalElements(res.totalElements);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Error al cargar contactos")
      )
      .finally(() => setLoading(false));
      
    // Obtener los contadores exactos de la base de datos completa
    api.funnelMetrics(filtroProyecto || undefined)
      .then(setFunnel)
      .catch(console.error);
  };

  useEffect(() => {
    fetchContactos();
  }, [page, filtroProyecto, filtroEstado]);

  useEffect(() => {
    api.proyectos().then(setProyectos).catch(console.error);
  }, []);

  const [isUnlockingBulk, setIsUnlockingBulk] = useState(false);

  const handleBulkUnlock = async () => {
    if (!confirm("¿Estás seguro de reiniciar todos los contactos bloqueados que coincidan con los filtros actuales?\n\nSe borrarán sus intentos y volverán a estar disponibles en la bolsa global.")) return;
    try {
      setIsUnlockingBulk(true);
      const res = await api.desbloquearContactosBulk(filtroProyecto || undefined, filtroEstado || undefined);
      alert(res.message);
      setPage(0);
      fetchContactos();
    } catch (err: any) {
      alert(err.message || "Error al realizar el desbloqueo masivo.");
    } finally {
      setIsUnlockingBulk(false);
    }
  };

  const pendientes  = funnel?.estados["PENDIENTE"] || 0;
  const enGestion   = funnel?.estados["EN_GESTION"] || 0;
  const contactados = funnel?.estados["CONTACTADO"] || 0;
  const desistidos  = funnel?.estados["DESISTIDO"] || 0;
  const cerrados    = funnel?.estados["CERRADO"] || 0;
  const cerradosMax = funnel?.estados["CERRADO_POR_INTENTOS"] || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Directorio {!loading && `(${totalElements} registros)`}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bolsa de trabajo global. Los contactos subidos aquí están disponibles para que cualquier agente los tome en tiempo real.
        </p>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm">
          ⚠️ {error}
        </div>
      )}

      {loading && contactos.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <>
          {/* Upload Component */}
          <UploadCSV onSuccess={() => { setPage(0); fetchContactos(); }} />

          {/* Resumen rápido */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Pendientes",  count: pendientes,  color: "bg-yellow-100 text-yellow-800" },
              { label: "En gestión",  count: enGestion,   color: "bg-blue-100 text-blue-800" },
              { label: "Contactados", count: contactados, color: "bg-green-100 text-green-800" },
              { label: "Desistidos",  count: desistidos,  color: "bg-red-100 text-red-800" },
              { label: "Cerrados",    count: cerrados,    color: "bg-slate-200 text-slate-800" },
              { label: "Max Intentos",count: cerradosMax, color: "bg-orange-100 text-orange-800" },
            ].map(({ label, count, color }) => (
              <div key={label} className={`rounded-lg px-4 py-3 text-center ${color}`}>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-xs font-medium mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-2 gap-4">
              <CardTitle className="text-base">Lista de contactos</CardTitle>
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  onClick={handleBulkUnlock}
                  disabled={isUnlockingBulk}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-orange-700 bg-orange-100 hover:bg-orange-200 rounded-md transition-colors disabled:opacity-50"
                  title="Desbloquear todos los contactos bloqueados con estos filtros"
                >
                  {isUnlockingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : "🔓"}
                  Desbloquear Filtrados
                </button>
                <select 
                  className="text-sm p-1.5 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  value={filtroEstado}
                  onChange={(e) => {
                    setFiltroEstado(e.target.value);
                    setPage(0);
                  }}
                >
                  <option value="">Todos los estados</option>
                  <option value="PENDIENTE">Pendientes</option>
                  <option value="EN_GESTION">En Gestión</option>
                  <option value="CONTACTADO">Contactados</option>
                  <option value="DESISTIDO">Desistidos</option>
                  <option value="CERRADO">Cerrados</option>
                  <option value="CERRADO_POR_INTENTOS">Max Intentos</option>
                </select>
                <select 
                  className="text-sm p-1.5 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  value={filtroProyecto}
                  onChange={(e) => {
                    setFiltroProyecto(e.target.value);
                    setPage(0); // Reset page on filter change
                  }}
                >
                  <option value="">Todos los proyectos</option>
                  {proyectos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {loading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-b-lg"><Loader2 className="w-6 h-6 animate-spin text-indigo-500"/></div>}
              <ContactosTable contactos={contactos} proyectos={proyectos} onRefresh={fetchContactos} />
              
              {/* Paginación */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <span className="text-sm text-slate-500">
                  Página {totalPages === 0 ? 0 : page + 1} de {totalPages}
                </span>
                <div className="flex gap-2">
                  <button 
                    disabled={page === 0 || loading}
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    className="px-3 py-1 text-sm border border-slate-300 rounded-md bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button 
                    disabled={page >= totalPages - 1 || loading}
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    className="px-3 py-1 text-sm border border-slate-300 rounded-md bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
