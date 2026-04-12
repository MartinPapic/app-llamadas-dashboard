import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Contacto } from "@/lib/api";

const estadoBadge: Record<string, { bg: string; text: string; label: string }> = {
  PENDIENTE:  { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pendiente" },
  EN_GESTION: { bg: "bg-blue-100",   text: "text-blue-800",   label: "En gestión" },
  CONTACTADO: { bg: "bg-green-100",  text: "text-green-800",  label: "Contactado" },
  DESISTIDO:  { bg: "bg-red-100",    text: "text-red-800",    label: "Desistido" },
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

export function ContactosTable({ contactos }: { contactos: Contacto[] }) {
  if (contactos.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        No hay contactos registrados.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Teléfono</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Intentos</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contactos.map((c) => {
          const badge = estadoBadge[c.estado] ?? { bg: "bg-slate-100", text: "text-slate-700", label: c.estado };
          return (
            <TableRow key={c.id} className="hover:bg-slate-50 transition-colors">
              <TableCell className="font-medium">{c.nombre}</TableCell>
              <TableCell className="font-mono text-sm text-slate-600">{c.telefono}</TableCell>
              <TableCell>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                  {badge.label}
                </span>
              </TableCell>
              <TableCell>
                <IntentosDots intentos={c.intentos} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
