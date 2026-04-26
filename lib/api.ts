// Todas las llamadas van a través del proxy Next.js (/api/proxy/...)
// que inyecta el token HttpOnly desde el servidor — el token nunca es accesible en JS.
const BASE = "/api/proxy";

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

export interface Proyecto {
  id: string;
  nombre: string;
  estado: "ACTIVO" | "INACTIVO";
  fechaCreacion: number;
}

export interface Contacto {
  id: string;
  nombre: string;
  telefono: string;
  estado: "PENDIENTE" | "EN_GESTION" | "CONTACTADO" | "DESISTIDO";
  intentos: number;
  fechaCreacion: number;
  agenteId?: string;
  proyectoId?: string;
}

export interface Llamada {
  id: string;
  contactoId: string;
  usuarioId: string;
  fechaInicio: number;
  fechaFin: number | null;
  duracion: number | null;
  resultado: "CONTACTADO_EFECTIVO" | "CONTACTADO_NO_EFECTIVO" | "NO_CONTACTADO" | null;
  tipificacion: string | null;
  motivo: string | null;
  observacion: string | null;
  proyectoId?: string;
}



async function safeFetch<T>(url: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      cache: "no-store",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers ?? {}),
      },
    });
  } catch {
    throw new Error("Error de red: no se pudo conectar con el servidor.");
  }

  if (res.status === 401) {
    // El proxy devuelve 401 cuando la cookie expiró — redirigir a login
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Sesión expirada.");
  }

  if (res.status === 403) {
    throw new Error("Acceso denegado (403): permisos insuficientes.");
  }

  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const api = {
  metricas: (proyectoId?: string): Promise<Metricas> =>
    safeFetch<Metricas>(`${BASE}/metrics${proyectoId ? `?proyectoId=${proyectoId}` : ""}`),

  realtimeMetrics: (): Promise<RealtimeMetrics> =>
    safeFetch<RealtimeMetrics>(`${BASE}/analytics/realtime`),

  funnelMetrics: (): Promise<FunnelMetrics> =>
    safeFetch<FunnelMetrics>(`${BASE}/analytics/funnel`),

  contactos: (): Promise<Contacto[]> =>
    safeFetch<Contacto[]>(`${BASE}/admin/contacts`),

  llamadas: (): Promise<Llamada[]> =>
    safeFetch<Llamada[]>(`${BASE}/admin/calls`),

  proyectos: (): Promise<Proyecto[]> =>
    safeFetch<Proyecto[]>(`${BASE}/projects`),

  crearProyecto: (p: Omit<Proyecto, "id" | "fechaCreacion">): Promise<Proyecto> =>
    safeFetch<Proyecto>(`${BASE}/projects`, {
      method: "POST",
      body: JSON.stringify(p),
    }),

  eliminarProyecto: (id: string): Promise<void> =>
    safeFetch(`${BASE}/projects/${id}`, { method: "DELETE" }),

  crearContacto: (c: Omit<Contacto, "id">): Promise<Contacto> =>
    safeFetch<Contacto>(`${BASE}/admin/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...c, id: crypto.randomUUID() }),
    }),

  agentes: (): Promise<Array<{ id: string; nombre: string; email: string }>> =>
    safeFetch(`${BASE}/admin/agents`),

  agenteStats: (): Promise<any[]> =>
    safeFetch(`${BASE}/analytics/agents`),

  uploadContactos: (contactos: Contacto[], proyectoId?: string): Promise<{ mensaje: string; cantidad: number }> =>
    safeFetch(`${BASE}/admin/contacts/upload${proyectoId ? `?proyectoId=${proyectoId}` : ""}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contactos),
    }),
};
