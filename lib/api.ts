const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export interface Metricas {
  totalContactos: number;
  totalLlamadas: number;
  totalContestan: number;
  totalNoContestan: number;
  duracionPromedio: number;
  tasaContacto: number;
}

export interface RealtimeMetrics {
  totalAgentesActivos?: number;
  llamadasEmitidasHoy: number;
  tasaContactabilidadDiaria: number;
  distribucionResultados: Record<string, number>;
}

export interface FunnelMetrics {
  totalBase: number;
  estados: Record<string, number>;
}

export interface Contacto {
  id: string;
  nombre: string;
  telefono: string;
  estado: "PENDIENTE" | "EN_GESTION" | "CONTACTADO" | "DESISTIDO";
  intentos: number;
  fechaCreacion: number;
  agenteId?: string;
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

export interface Encuesta {
  id: string;
  contactoId: string;
  url: string;
  estado: "COMPLETA" | "INCOMPLETA" | "NO_REALIZADA";
  fecha: number;
}

function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function safeFetch<T>(url: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      cache: "no-store",
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...(options?.headers ?? {}),
      },
    });
  } catch {
    throw new Error("Error de red: no se pudo conectar con el servidor. Verifica tu conexión.");
  }

  if (res.status === 401) {
    // Token expirado — destruir sesión y redirigir
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin_token");
      document.cookie =
        "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      window.location.href = "/login";
    }
    throw new Error("Sesión expirada. Inicia sesión nuevamente.");
  }

  if (res.status === 403) {
    // Sin permisos, pero la sesión sigue válida — no destruir
    throw new Error("Acceso denegado (403): tu usuario no tiene permisos para este recurso.");
  }

  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const api = {
  metricas: (): Promise<Metricas> =>
    safeFetch<Metricas>(`${BASE}/metrics`),

  realtimeMetrics: (): Promise<RealtimeMetrics> =>
    safeFetch<RealtimeMetrics>(`${BASE}/analytics/realtime`),

  funnelMetrics: (): Promise<FunnelMetrics> =>
    safeFetch<FunnelMetrics>(`${BASE}/analytics/funnel`),

  contactos: (): Promise<Contacto[]> =>
    safeFetch<Contacto[]>(`${BASE}/admin/contacts`),

  encuestas: (): Promise<Encuesta[]> =>
    safeFetch<Encuesta[]>(`${BASE}/admin/surveys`),

  llamadas: (): Promise<Llamada[]> =>
    safeFetch<Llamada[]>(`${BASE}/admin/calls`),

  crearContacto: (c: Omit<Contacto, "id">): Promise<Contacto> =>
    safeFetch<Contacto>(`${BASE}/admin/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...c, id: crypto.randomUUID() }),
    }),

  agentes: (): Promise<Array<{ id: string; nombre: string; email: string }>> =>
    safeFetch(`${BASE}/admin/agents`),

  uploadContactos: (contactos: Contacto[]): Promise<{ mensaje: string; cantidad: number }> =>
    safeFetch(`${BASE}/admin/contacts/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contactos),
    }),
};
