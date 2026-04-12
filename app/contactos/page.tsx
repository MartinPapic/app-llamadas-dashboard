import { api } from "@/lib/api";
import { ContactosTable } from "@/components/ContactosTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const revalidate = 30;

export default async function ContactosPage() {
  let contactos: Awaited<ReturnType<typeof api.contactos>> = [];
  let error: string | null = null;

  try {
    contactos = await api.contactos();
  } catch {
    error = "No se pudo conectar al backend. Verifica que el servidor esté corriendo.";
  }

  const pendientes  = contactos.filter((c) => c.estado === "PENDIENTE").length;
  const enGestion   = contactos.filter((c) => c.estado === "EN_GESTION").length;
  const contactados = contactos.filter((c) => c.estado === "CONTACTADO").length;
  const desistidos  = contactos.filter((c) => c.estado === "DESISTIDO").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Contactos ({contactos.length})
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestión y seguimiento de todos los contactos
        </p>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Resumen rápido */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Pendientes",  count: pendientes,  color: "bg-yellow-100 text-yellow-800" },
          { label: "En gestión",  count: enGestion,   color: "bg-blue-100 text-blue-800" },
          { label: "Contactados", count: contactados, color: "bg-green-100 text-green-800" },
          { label: "Desistidos",  count: desistidos,  color: "bg-red-100 text-red-800" },
        ].map(({ label, count, color }) => (
          <div key={label} className={`rounded-lg px-4 py-3 text-center ${color}`}>
            <div className="text-2xl font-bold">{count}</div>
            <div className="text-xs font-medium mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lista de contactos</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactosTable contactos={contactos} />
        </CardContent>
      </Card>
    </div>
  );
}
