const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export interface Metricas {
  totalContactos: number;
  totalLlamadas: number;
  totalContestan: number;
  totalNoContestan: number;
  duracionPromedio: number;
  tasaContacto: number;
}

export interface Contacto {
  id: string;
  nombre: string;
  telefono: string;
  estado: "PENDIENTE" | "EN_GESTION" | "CONTACTADO" | "DESISTIDO";
  intentos: number;
  fechaCreacion: number;
}

export interface Llamada {
  id: string;
  contactoId: string;
  usuarioId: string;
  fechaInicio: number;
  fechaFin: number | null;
  duracion: number | null;
  resultado: "CONTESTA" | "NO_CONTESTA" | "OCUPADO" | "INVALIDO" | null;
  tipificacion: string | null;
  observacion: string | null;
}

async function safeFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...options });
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const api = {
  metricas: (): Promise<Metricas> =>
    safeFetch<Metricas>(`${BASE}/api/dashboard/metricas`),

  contactos: (): Promise<Contacto[]> =>
    safeFetch<Contacto[]>(`${BASE}/api/dashboard/contactos`),

  llamadas: (): Promise<Llamada[]> =>
    safeFetch<Llamada[]>(`${BASE}/api/dashboard/llamadas`),

  crearContacto: (c: Omit<Contacto, "id">): Promise<Contacto> =>
    safeFetch<Contacto>(`${BASE}/api/dashboard/contactos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...c, id: crypto.randomUUID() }),
    }),
};
