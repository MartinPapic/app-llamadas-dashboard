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

export interface Lista {
  id: string;
  nombre: string;
  proyectoId: string;
  fechaCreacion: number;
  estado: string;
}

export interface Contacto {
  id: string;
  nombre: string;
  telefono: string;
  estado: "PENDIENTE" | "EN_GESTION" | "CONTACTADO" | "DESISTIDO" | "CERRADO" | "CERRADO_POR_INTENTOS";
  intentos: number;
  intentosValidos: number;
  fechaCreacion: number;
  agenteId?: string;
  proyectoId?: string;
  listaId?: string;
  referenciaId?: string;
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

export interface ExportData {
  llamadaId: string;
  contactoId: string;
  listaId: string | null;
  referenciaId: string | null;
  nombreContacto: string;
  telefonoContacto: string;
  fechaLlamada: number;
  duracion: number | null;
  agenteId: string;
  emailAgente: string;
  resultado: string | null;
  tipificacion: string | null;
  motivo: string | null;
  observacion: string | null;
  intentoValido: boolean;
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
  if (res.status === 204) return null as unknown as T;
  
  const text = await res.text();
  return text ? JSON.parse(text) as T : (null as unknown as T);
}

export const api = {
  metricas: (proyectoId?: string): Promise<Metricas> =>
    safeFetch<Metricas>(`${BASE}/metrics${proyectoId ? `?proyectoId=${proyectoId}` : ""}`),

  realtimeMetrics: (): Promise<RealtimeMetrics> =>
    safeFetch<RealtimeMetrics>(`${BASE}/analytics/realtime`),

  funnelMetrics: (): Promise<FunnelMetrics> =>
    safeFetch<FunnelMetrics>(`${BASE}/analytics/funnel`),

  exportarDatos: (proyectoId?: string): Promise<ExportData[]> =>
    safeFetch<ExportData[]>(`${BASE}/analytics/export${proyectoId ? `?proyectoId=${proyectoId}` : ""}`),

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

  uploadContactos: (contactos: Contacto[], proyectoId?: string, listaId?: string): Promise<{ mensaje: string; cantidad: number }> => {
    const params = new URLSearchParams();
    if (proyectoId) params.append("proyectoId", proyectoId);
    if (listaId) params.append("listaId", listaId);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return safeFetch(`${BASE}/admin/contacts/upload${qs}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contactos),
    });
  },

  asignarAgente: (usuarioId: string, proyectoId: string): Promise<unknown> =>
    safeFetch(`${BASE}/projects/asignar`, {
      method: "POST",
      body: JSON.stringify({ usuarioId, proyectoId }),
    }),

  desasignarAgente: (asignacionId: number): Promise<void> =>
    safeFetch(`${BASE}/projects/asignaciones/${asignacionId}`, { method: "DELETE" }),

  agentesDeProyecto: (proyectoId: string): Promise<Array<{ asignacionId: number; id: string; nombre: string; email: string }>> =>
    safeFetch(`${BASE}/projects/${proyectoId}/agentes`),

  // Listas
  listasDeProyecto: (proyectoId: string): Promise<Lista[]> =>
    safeFetch(`${BASE}/listas/proyecto/${proyectoId}`),

  crearLista: (lista: Omit<Lista, "id" | "fechaCreacion" | "estado">): Promise<Lista> =>
    safeFetch(`${BASE}/listas`, {
      method: "POST",
      body: JSON.stringify(lista),
    }),

  eliminarLista: (id: string): Promise<void> =>
    safeFetch(`${BASE}/listas/${id}`, { method: "DELETE" }),

  asignarAgenteLista: (usuarioId: string, listaId: string): Promise<unknown> =>
    safeFetch(`${BASE}/listas/asignar`, {
      method: "POST",
      body: JSON.stringify({ usuarioId, listaId }),
    }),

  desasignarAgenteLista: (asignacionId: number): Promise<void> =>
    safeFetch(`${BASE}/listas/asignaciones/${asignacionId}`, { method: "DELETE" }),

  agentesDeLista: (listaId: string): Promise<Array<{ asignacionId: number; id: string; nombre: string; email: string }>> =>
    safeFetch(`${BASE}/listas/${listaId}/agentes`),
};
