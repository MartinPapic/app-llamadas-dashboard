import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Unlock, Loader2 } from "lucide-react";
import { useState } from "react";
import { Contacto, api } from "@/lib/api";

const estadoBadge: Record<string, { bg: string; text: string; label: string }> = {
  PENDIENTE:  { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pendiente" },
  EN_GESTION: { bg: "bg-blue-100",   text: "text-blue-800",   label: "En gestión" },
  CONTACTADO: { bg: "bg-green-100",  text: "text-green-800",  label: "Contactado" },
  DESISTIDO:  { bg: "bg-red-100",    text: "text-red-800",    label: "Desistido" },
  CERRADO_POR_INTENTOS: { bg: "bg-orange-100", text: "text-orange-800", label: "Max. Intentos" },
};

function IntentosDots({ intentos }: { intentos: number }) {
  const MAX = 5;
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: MAX }).map((_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full transition-colors ${
            i < intentos
              ? intentos >= MAX
                ? "bg-red-500"
                : intentos >= 3
                ? "bg-yellow-500"
                : "bg-indigo-500"
              : "bg-slate-200"
          }`}
        />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{intentos}/{MAX}</span>
    </div>
  );
}

export function ContactosTable({ contactos, proyectos, onRefresh }: { contactos: Contacto[], proyectos?: import("@/lib/api").Proyecto[], onRefresh?: () => void }) {
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  const handleUnlock = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas reiniciar este contacto? Se borrarán sus intentos.")) return;
    try {
      setUnlockingId(id);
      await api.desbloquearContacto(id);
      alert("Contacto reiniciado con éxito.");
      if (onRefresh) onRefresh();
    } catch (err) {
      alert("Error al desbloquear el contacto.");
      console.error(err);
    } finally {
      setUnlockingId(null);
    }
  };
  if (contactos.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        No hay contactos registrados.
      </div>
    );
  }

  const getProjectName = (id?: string) => {
    if (!id || !proyectos) return "N/A";
    const p = proyectos.find(p => p.id === id);
    return p ? p.nombre : "N/A";
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Teléfono</TableHead>
          <TableHead>Proyecto</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Intentos</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contactos.map((c) => {
          const badge = estadoBadge[c.estado] ?? { bg: "bg-slate-100", text: "text-slate-700", label: c.estado };
          const canUnlock = c.estado === "CERRADO_POR_INTENTOS" || c.estado === "CERRADO" || c.estado === "DESISTIDO" || c.intentos >= 5 || (c.intentosValidos ?? 0) >= 5;
          
          return (
            <TableRow key={c.id} className="hover:bg-slate-50 transition-colors">
              <TableCell className="font-medium">{c.nombre}</TableCell>
              <TableCell className="font-mono text-sm text-slate-600">{c.telefono}</TableCell>
              <TableCell className="text-sm text-slate-500">{getProjectName(c.proyectoId)}</TableCell>
              <TableCell>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                  {badge.label}
                </span>
              </TableCell>
              <TableCell>
                <IntentosDots intentos={c.intentosValidos ?? c.intentos} />
              </TableCell>
              <TableCell className="text-right">
                {canUnlock && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleUnlock(c.id)}
                    disabled={unlockingId === c.id}
                    className="text-orange-600 hover:bg-orange-50 hover:text-orange-700 h-8 px-2"
                  >
                    {unlockingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Unlock className="w-3.5 h-3.5 mr-1" />}
                    Reiniciar
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
