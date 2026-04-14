"use client";

import { useEffect, useState } from "react";
import { api, type Llamada } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2 } from "lucide-react";

const resultadoStyle: Record<string, { dot: string; label: string }> = {
  CONTESTA:     { dot: "bg-green-500",  label: "Contesta" },
  NO_CONTESTA:  { dot: "bg-red-500",    label: "No contesta" },
  OCUPADO:      { dot: "bg-yellow-500", label: "Ocupado" },
  INVALIDO:     { dot: "bg-slate-400",  label: "Inválido" },
};

function formatDuracion(seg: number | null): string {
  if (seg == null) return "—";
  if (seg < 60) return `${seg}s`;
  return `${Math.floor(seg / 60)}m ${seg % 60}s`;
}

export default function LlamadasPage() {
  const [llamadas, setLlamadas] = useState<Llamada[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.llamadas()
      .then(setLlamadas)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Error al cargar llamadas")
      )
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...llamadas].sort((a, b) => b.fechaInicio - a.fechaInicio);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Historial de llamadas {!loading && `(${sorted.length})`}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registro cronológico de todas las llamadas realizadas
        </p>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Todas las llamadas</CardTitle>
          </CardHeader>
          <CardContent>
            {sorted.length === 0 && !error ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                No hay llamadas registradas aún.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agente</TableHead>
                    <TableHead>Fecha y hora</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Tipificación</TableHead>
                    <TableHead>Observación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((l) => {
                    const res = resultadoStyle[l.resultado ?? ""] ?? null;
                    return (
                      <TableRow key={l.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="font-medium text-sm">{l.usuarioId}</TableCell>
                        <TableCell className="text-sm text-slate-500 whitespace-nowrap">
                          {format(new Date(l.fechaInicio), "dd/MM/yyyy HH:mm", { locale: es })}
                        </TableCell>
                        <TableCell>
                          {res ? (
                            <span className="flex items-center gap-1.5 text-sm">
                              <span className={`w-2 h-2 rounded-full inline-block ${res.dot}`} />
                              {res.label}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm font-mono">
                          {formatDuracion(l.duracion)}
                        </TableCell>
                        <TableCell className="text-sm">{l.tipificacion ?? "—"}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-slate-600">
                          {l.observacion ?? "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
