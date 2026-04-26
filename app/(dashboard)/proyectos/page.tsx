"use client";

import { useEffect, useState } from "react";
import { api, type Proyecto } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProyectosPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchProyectos = () => {
    setLoading(true);
    api.proyectos()
      .then(setProyectos)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Error al cargar proyectos")
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProyectos();
  }, []);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    
    setSaving(true);
    try {
      await api.crearProyecto({ nombre });
      setShowForm(false);
      setNombre("");
      fetchProyectos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear proyecto");
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este proyecto?")) return;
    try {
      await api.eliminarProyecto(id);
      fetchProyectos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar proyecto");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Proyectos {!loading && `(${proyectos.length})`}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión de proyectos y campañas telefónicas.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" /> Nuevo Proyecto
        </Button>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm">
          ⚠️ {error}
        </div>
      )}

      {showForm && (
        <Card className="border-indigo-100 shadow-md">
          <CardHeader className="bg-indigo-50/50 pb-4">
            <CardTitle className="text-lg text-indigo-900">Crear Nuevo Proyecto</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleCrear} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre del Proyecto</label>
                  <Input 
                    placeholder="Ej: Campaña de Llamadas 2026" 
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Guardar Proyecto
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proyectos.map((proyecto) => (
            <Card key={proyecto.id} className="hover:border-indigo-200 transition-colors">
              <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                <CardTitle className="text-base font-bold text-slate-800 line-clamp-2">
                  {proyecto.nombre}
                </CardTitle>
                <button 
                  onClick={() => handleEliminar(proyecto.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors ml-2"
                  title="Eliminar proyecto"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-slate-400">
                  Creado el: {new Date(proyecto.fechaCreacion).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
          
          {proyectos.length === 0 && !showForm && (
            <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              No hay proyectos creados. Haz clic en "Nuevo Proyecto" para empezar.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
