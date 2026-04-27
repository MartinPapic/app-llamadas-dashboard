"use client";

import { useEffect, useState, useCallback } from "react";
import { api, type Proyecto } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2, Users, X, UserPlus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Agente = { id: string; nombre: string; email: string };
type AgenteAsignado = { asignacionId: number; id: string; nombre: string; email: string };

export default function ProyectosPage() {
  const [proyectos, setProyectos]   = useState<Proyecto[]>([]);
  const [agentes, setAgentes]       = useState<Agente[]>([]);
  const [error, setError]           = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);

  // Form – nuevo proyecto
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre]     = useState("");
  const [saving, setSaving]     = useState(false);

  // Panel de asignación por proyecto
  const [expanded, setExpanded]           = useState<string | null>(null); // proyectoId abierto
  const [asignados, setAsignados]         = useState<Record<string, AgenteAsignado[]>>({});
  const [loadingPanel, setLoadingPanel]   = useState(false);
  const [selectedAgente, setSelectedAgente] = useState<Record<string, string>>({}); // proyectoId → agenteId

  const fetchProyectos = useCallback(() => {
    setLoading(true);
    api.proyectos()
      .then(setProyectos)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Error al cargar proyectos"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchProyectos();
    api.agentes().then(setAgentes).catch(() => {});
  }, [fetchProyectos]);

  // ── Abrir / cerrar panel de agentes de un proyecto ──────────────────────────
  const togglePanel = async (proyectoId: string) => {
    if (expanded === proyectoId) { setExpanded(null); return; }
    setExpanded(proyectoId);
    if (asignados[proyectoId]) return; // ya cargados
    setLoadingPanel(true);
    try {
      const data = await api.agentesDeProyecto(proyectoId);
      setAsignados(prev => ({ ...prev, [proyectoId]: data }));
    } catch {
      setError("Error al cargar agentes del proyecto");
    } finally {
      setLoadingPanel(false);
    }
  };

  // ── Asignar un agente ────────────────────────────────────────────────────────
  const handleAsignar = async (proyectoId: string) => {
    const usuarioId = selectedAgente[proyectoId];
    if (!usuarioId) return;

    // Evitar duplicado
    if (asignados[proyectoId]?.some(a => a.id === usuarioId)) {
      setError("Ese agente ya está asignado a este proyecto.");
      return;
    }
    try {
      await api.asignarAgente(usuarioId, proyectoId);
      // Recargar panel
      const data = await api.agentesDeProyecto(proyectoId);
      setAsignados(prev => ({ ...prev, [proyectoId]: data }));
      setSelectedAgente(prev => ({ ...prev, [proyectoId]: "" }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al asignar agente");
    }
  };

  // ── Desasignar un agente ─────────────────────────────────────────────────────
  const handleDesasignar = async (proyectoId: string, asignacionId: number) => {
    try {
      await api.desasignarAgente(asignacionId);
      setAsignados(prev => ({
        ...prev,
        [proyectoId]: prev[proyectoId].filter(a => a.asignacionId !== asignacionId)
      }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al desasignar agente");
    }
  };

  // ── Crear proyecto ────────────────────────────────────────────────────────────
  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setSaving(true);
    try {
      await api.crearProyecto({ nombre, estado: "ACTIVO" });
      setShowForm(false);
      setNombre("");
      fetchProyectos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear proyecto");
    } finally {
      setSaving(false);
    }
  };

  // ── Eliminar proyecto ─────────────────────────────────────────────────────────
  const handleEliminar = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este proyecto?")) return;
    try {
      await api.eliminarProyecto(id);
      fetchProyectos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar proyecto");
    }
  };

  // Agentes disponibles (los que aún no están asignados a ese proyecto)
  const agentesDisponibles = (proyectoId: string) =>
    agentes.filter(a => !asignados[proyectoId]?.some(as => as.id === a.id));

  return (
    <div className="space-y-6">
      {/* ── Cabecera ── */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Proyectos {!loading && `(${proyectos.length})`}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión de proyectos, campañas y asignación de agentes.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" /> Nuevo Proyecto
        </Button>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="ml-4 text-amber-500 hover:text-amber-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Formulario Nuevo Proyecto ── */}
      {showForm && (
        <Card className="border-indigo-100 shadow-md">
          <CardHeader className="bg-indigo-50/50 pb-4">
            <CardTitle className="text-lg text-indigo-900">Crear Nuevo Proyecto</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleCrear} className="flex gap-3 items-end">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Nombre del Proyecto</label>
                <Input
                  placeholder="Ej: Campaña de Llamadas 2026"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Guardar
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ── Lista de Proyectos ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {proyectos.map((proyecto) => {
            const isOpen       = expanded === proyecto.id;
            const panelAgentes = asignados[proyecto.id] ?? [];
            const disponibles  = agentesDisponibles(proyecto.id);

            return (
              <Card key={proyecto.id} className={`transition-all ${isOpen ? "border-indigo-300 shadow-md" : "hover:border-indigo-200"}`}>
                {/* ── Cabecera de la tarjeta ── */}
                <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-bold text-slate-800 line-clamp-2">{proyecto.nombre}</CardTitle>
                    <p className="text-xs text-slate-400 mt-1">Creado el: {new Date(proyecto.fechaCreacion).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => handleEliminar(proyecto.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors ml-2 shrink-0"
                    title="Eliminar proyecto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {/* ── Botón expandir agentes ── */}
                  <button
                    onClick={() => togglePanel(proyecto.id)}
                    className="w-full flex items-center justify-between text-sm text-indigo-600 font-medium hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg px-3 py-2 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Gestionar Agentes
                    </span>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {/* ── Panel de Agentes (colapsable) ── */}
                  {isOpen && (
                    <div className="space-y-3 pt-1">
                      {/* Agentes ya asignados */}
                      {loadingPanel && panelAgentes.length === 0 ? (
                        <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-slate-400" /></div>
                      ) : panelAgentes.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-2">Sin agentes asignados aún.</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {panelAgentes.map(ag => (
                            <li key={ag.asignacionId} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-1.5 text-sm">
                              <div>
                                <span className="font-medium text-slate-700">{ag.nombre}</span>
                                <span className="text-slate-400 text-xs ml-2">{ag.email}</span>
                              </div>
                              <button
                                onClick={() => handleDesasignar(proyecto.id, ag.asignacionId)}
                                className="text-slate-300 hover:text-red-500 transition-colors ml-2"
                                title="Quitar agente"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Selector para agregar nuevo agente */}
                      {disponibles.length > 0 ? (
                        <div className="flex gap-2 pt-1">
                          <select
                            className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            value={selectedAgente[proyecto.id] ?? ""}
                            onChange={e => setSelectedAgente(prev => ({ ...prev, [proyecto.id]: e.target.value }))}
                          >
                            <option value="">— Seleccionar agente —</option>
                            {disponibles.map(a => (
                              <option key={a.id} value={a.id}>{a.nombre} ({a.email})</option>
                            ))}
                          </select>
                          <Button
                            size="sm"
                            onClick={() => handleAsignar(proyecto.id)}
                            disabled={!selectedAgente[proyecto.id]}
                            className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-emerald-600 italic text-center py-1">✓ Todos los agentes están asignados.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {proyectos.length === 0 && !showForm && (
            <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              No hay proyectos creados. Haz clic en &quot;Nuevo Proyecto&quot; para empezar.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
