"use client";

import { useEffect, useState, useCallback } from "react";
import { api, type Proyecto, type Lista } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2, Users, X, UserPlus, ChevronDown, ChevronUp, List as ListIcon } from "lucide-react";
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

  // Panel de listas por proyecto
  const [expandedProject, setExpandedProject] = useState<string | null>(null); 
  const [listas, setListas] = useState<Record<string, Lista[]>>({});
  const [loadingListas, setLoadingListas] = useState(false);
  
  // Crear lista
  const [nuevaListaNombre, setNuevaListaNombre] = useState<Record<string, string>>({});
  const [nuevaListaTope, setNuevaListaTope] = useState<Record<string, string>>({});

  // Panel de asignación por lista
  const [expandedList, setExpandedList] = useState<string | null>(null);
  const [asignados, setAsignados] = useState<Record<string, AgenteAsignado[]>>({});
  const [loadingAgentes, setLoadingAgentes] = useState(false);
  const [selectedAgente, setSelectedAgente] = useState<Record<string, string>>({}); 

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

  // ── Proyecto ────────────────────────────────────────────────────────
  const handleCrearProyecto = async (e: React.FormEvent) => {
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

  const handleEliminarProyecto = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este proyecto y TODAS sus listas?")) return;
    try {
      await api.eliminarProyecto(id);
      fetchProyectos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar proyecto");
    }
  };

  // ── Listas ────────────────────────────────────────────────────────────
  const toggleProject = async (proyectoId: string) => {
    if (expandedProject === proyectoId) { setExpandedProject(null); return; }
    setExpandedProject(proyectoId);
    if (listas[proyectoId]) return;
    setLoadingListas(true);
    try {
      const data = await api.listasDeProyecto(proyectoId);
      setListas(prev => ({ ...prev, [proyectoId]: data }));
    } catch {
      setError("Error al cargar listas del proyecto");
    } finally {
      setLoadingListas(false);
    }
  };

  const handleCrearLista = async (proyectoId: string) => {
    const listName = nuevaListaNombre[proyectoId];
    const listTopeStr = nuevaListaTope[proyectoId];
    if (!listName?.trim()) return;
    
    const maxVal = listTopeStr?.trim() ? parseInt(listTopeStr, 10) : null;
    const maxGestionExitosa = maxVal !== null && !isNaN(maxVal) ? maxVal : null;

    try {
      const nueva = await api.crearLista({ 
        nombre: listName, 
        proyectoId, 
        maxGestionExitosa 
      });
      setListas(prev => ({ ...prev, [proyectoId]: [...(prev[proyectoId] || []), nueva] }));
      setNuevaListaNombre(prev => ({ ...prev, [proyectoId]: "" }));
      setNuevaListaTope(prev => ({ ...prev, [proyectoId]: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear lista");
    }
  };

  const handleEliminarLista = async (proyectoId: string, listaId: string) => {
    if (!confirm("¿Eliminar esta lista?")) return;
    try {
      await api.eliminarLista(listaId);
      setListas(prev => ({
        ...prev,
        [proyectoId]: prev[proyectoId].filter(l => l.id !== listaId)
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar lista");
    }
  };

  const handleActualizarTope = async (lista: Lista, maxGestionExitosa: number | null) => {
    try {
      const actualizada = await api.crearLista({
        ...lista,
        maxGestionExitosa
      });
      setListas(prev => {
        const proyectoId = lista.proyectoId;
        return {
          ...prev,
          [proyectoId]: prev[proyectoId].map(l => l.id === lista.id ? actualizada : l)
        };
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar tope de lista");
    }
  };

  // ── Agentes por Lista ─────────────────────────────────────────────────
  const toggleLista = async (listaId: string) => {
    if (expandedList === listaId) { setExpandedList(null); return; }
    setExpandedList(listaId);
    if (asignados[listaId]) return;
    setLoadingAgentes(true);
    try {
      const data = await api.agentesDeLista(listaId);
      setAsignados(prev => ({ ...prev, [listaId]: data }));
    } catch {
      setError("Error al cargar agentes de la lista");
    } finally {
      setLoadingAgentes(false);
    }
  };

  const handleAsignar = async (listaId: string) => {
    const usuarioId = selectedAgente[listaId];
    if (!usuarioId) return;

    if (asignados[listaId]?.some(a => a.id === usuarioId)) {
      setError("Agente ya asignado a esta lista.");
      return;
    }
    try {
      await api.asignarAgenteLista(usuarioId, listaId);
      const data = await api.agentesDeLista(listaId);
      setAsignados(prev => ({ ...prev, [listaId]: data }));
      setSelectedAgente(prev => ({ ...prev, [listaId]: "" }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al asignar agente");
    }
  };

  const handleDesasignar = async (listaId: string, asignacionId: number) => {
    try {
      await api.desasignarAgenteLista(asignacionId);
      setAsignados(prev => ({
        ...prev,
        [listaId]: prev[listaId].filter(a => a.asignacionId !== asignacionId)
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al desasignar agente");
    }
  };

  const agentesDisponibles = (listaId: string) =>
    agentes.filter(a => !asignados[listaId]?.some(as => as.id === a.id));

  return (
    <div className="space-y-6">
      {/* ── Cabecera ── */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Proyectos y Listas {!loading && `(${proyectos.length})`}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión de proyectos, listas de contactos y asignación de agentes.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" /> Nuevo Proyecto
        </Button>
      </div>

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
            <form onSubmit={handleCrearProyecto} className="flex gap-3 items-end">
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
        <div className="space-y-4">
          {proyectos.map((proyecto) => {
            const isProjectOpen = expandedProject === proyecto.id;
            const projectLists = listas[proyecto.id] ?? [];

            return (
              <Card key={proyecto.id} className={`transition-all ${isProjectOpen ? "border-indigo-300 shadow-md" : "hover:border-indigo-200"}`}>
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 cursor-pointer" onClick={() => toggleProject(proyecto.id)}>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-bold text-slate-800">{proyecto.nombre}</CardTitle>
                    <p className="text-xs text-slate-400 mt-1">Creado el: {new Date(proyecto.fechaCreacion).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-md flex items-center gap-2">
                      <ListIcon className="w-4 h-4"/> Listas
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEliminarProyecto(proyecto.id); }}
                      className="text-slate-300 hover:text-red-500 transition-colors shrink-0"
                      title="Eliminar proyecto"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                    {isProjectOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                  </div>
                </CardHeader>

                {isProjectOpen && (
                  <CardContent className="pt-2 border-t border-slate-100 bg-slate-50/50">
                    {/* Crear nueva lista */}
                    <div className="flex gap-2 mb-4 items-center">
                      <Input 
                        placeholder="Nombre de la nueva lista..." 
                        value={nuevaListaNombre[proyecto.id] ?? ""}
                        onChange={e => setNuevaListaNombre(prev => ({ ...prev, [proyecto.id]: e.target.value }))}
                        className="bg-white text-sm flex-[2]"
                      />
                      <Input 
                        type="number"
                        placeholder="Tope G. Exitosa (opcional)" 
                        value={nuevaListaTope[proyecto.id] ?? ""}
                        onChange={e => setNuevaListaTope(prev => ({ ...prev, [proyecto.id]: e.target.value }))}
                        className="bg-white text-sm flex-[1]"
                        min="1"
                      />
                      <Button onClick={() => handleCrearLista(proyecto.id)} size="sm" className="bg-indigo-600 hover:bg-indigo-700 shrink-0">
                        <Plus className="w-4 h-4 mr-2"/> Añadir Lista
                      </Button>
                    </div>

                    {/* Listado de Listas */}
                    {loadingListas && projectLists.length === 0 ? (
                      <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-slate-400" /></div>
                    ) : projectLists.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">No hay listas en este proyecto.</p>
                    ) : (
                      <div className="space-y-3">
                        {projectLists.map(lista => {
                          const isListOpen = expandedList === lista.id;
                          const listAgents = asignados[lista.id] ?? [];
                          const disponibles = agentesDisponibles(lista.id);

                          return (
                            <div key={lista.id} className="bg-white border border-slate-200 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <h4 className="font-semibold text-slate-800 text-sm">
                                    {lista.nombre}
                                  </h4>
                                  <div className="flex items-center gap-1.5" title="Establecer límite de gestiones exitosas. Presiona Enter o haz clic fuera para guardar.">
                                    <span className="text-[10px] text-slate-400 font-medium shrink-0 bg-slate-100 px-1.5 py-0.5 rounded">Tope:</span>
                                    <Input
                                      type="number"
                                      placeholder="Sin tope"
                                      className="w-16 h-6 text-[10px] bg-slate-50 border-slate-200 px-1 text-center shrink-0 font-medium"
                                      defaultValue={lista.maxGestionExitosa ?? ""}
                                      onBlur={async (e) => {
                                        const val = e.target.value.trim();
                                        const maxVal = val ? parseInt(val, 10) : null;
                                        const maxGestionExitosa = maxVal !== null && !isNaN(maxVal) ? maxVal : null;
                                        if (maxGestionExitosa !== lista.maxGestionExitosa) {
                                          await handleActualizarTope(lista, maxGestionExitosa);
                                        }
                                      }}
                                      onKeyDown={async (e) => {
                                        if (e.key === "Enter") {
                                          e.currentTarget.blur();
                                        }
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-3">
                                  <button onClick={() => toggleLista(lista.id)} className="text-indigo-600 text-sm font-medium hover:underline flex items-center gap-1">
                                    <Users className="w-4 h-4"/> Agentes ({listAgents.length})
                                  </button>
                                  <button onClick={() => handleEliminarLista(proyecto.id, lista.id)} className="text-slate-400 hover:text-red-500">
                                    <Trash2 className="w-4 h-4"/>
                                  </button>
                                </div>
                              </div>

                              {isListOpen && (
                                <div className="mt-3 pt-3 border-t border-slate-100">
                                  {loadingAgentes && listAgents.length === 0 ? (
                                    <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin text-slate-400" /></div>
                                  ) : (
                                    <ul className="space-y-2 mb-3">
                                      {listAgents.length === 0 && <p className="text-xs text-slate-400 italic">Sin agentes asignados.</p>}
                                      {listAgents.map(ag => (
                                        <li key={ag.asignacionId} className="flex items-center justify-between bg-slate-50 rounded-md px-3 py-1.5 text-sm">
                                          <span className="font-medium text-slate-700">{ag.nombre} <span className="text-slate-400 font-normal ml-2">{ag.email}</span></span>
                                          <button onClick={() => handleDesasignar(lista.id, ag.asignacionId)} className="text-slate-400 hover:text-red-500">
                                            <X className="w-4 h-4" />
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                  
                                  {disponibles.length > 0 && (
                                    <div className="flex gap-2">
                                      <select
                                        className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
                                        value={selectedAgente[lista.id] ?? ""}
                                        onChange={e => setSelectedAgente(prev => ({ ...prev, [lista.id]: e.target.value }))}
                                      >
                                        <option value="">— Asignar agente —</option>
                                        {disponibles.map(a => (
                                          <option key={a.id} value={a.id}>{a.nombre} ({a.email})</option>
                                        ))}
                                      </select>
                                      <Button size="sm" onClick={() => handleAsignar(lista.id)} disabled={!selectedAgente[lista.id]} className="bg-slate-800 hover:bg-slate-900">
                                        Asignar
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}

          {proyectos.length === 0 && !showForm && (
            <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              No hay proyectos creados.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
