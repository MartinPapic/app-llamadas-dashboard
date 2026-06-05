// Todas las llamadas van a través del proxy Next.js (/api/proxy/...)
// que inyecta el token HttpOnly desde el servidor — el token nunca es accesible en JS.
const BASE = "/api/proxy";

export interface Metricas {
  totalContactos: number;
  totalLlamadas: number;
  totalLlamadasValidas: number;
  totalContestan: number;
  totalNoContestan: number;
  duracionPromedio: number;
  tasaContacto: number;
  distribucionTipificaciones: Record<string, number>;
  totalGestionExitosa: number;
  metaGestionesExitosas: number;
}

export interface RealtimeMetrics {
  totalAgentesActivos?: number;
  llamadasEmitidasHoy: number;
  tasaContactabilidadDiaria: number;
  distribucionResultados: Record<string, number>;
  gestionExitosaHoy?: number;
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
  maxGestionExitosa?: number | null;
  totalContactos?: number;
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
  event_id: string;
  event_type: string;
  event_timestamp: number;
  record_id: string;
  record_phone: string;
  record_name: string;
  group_id: string | null;
  group_name: string | null;
  sub_group_id: string | null;
  sub_group_name: string | null;
  user_id: string;
  user_name: string;
  attempt_number: number;
  is_valid_attempt: boolean;
  attempt_date: string;
  duration_seconds: number | null;
  duration_minutes: number | null;
  classification: string | null;
  is_closing_classification: boolean;
  classification_reverted: boolean;
  record_status: string;
  closure_reason: string | null;
  total_valid_attempts: number;
  is_blocked: boolean;
  is_callable: boolean;
  previous_event_id: string | null;
  action_source: string;
  comments: string | null;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
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

  realtimeMetrics: (proyectoId?: string): Promise<RealtimeMetrics> =>
    safeFetch<RealtimeMetrics>(`${BASE}/analytics/realtime${proyectoId ? `?proyectoId=${proyectoId}` : ""}`),

  funnelMetrics: (proyectoId?: string): Promise<FunnelMetrics> =>
    safeFetch<FunnelMetrics>(`${BASE}/analytics/funnel${proyectoId ? `?proyectoId=${proyectoId}` : ""}`),

  exportarDatos: (filtros?: { proyectoId?: string; agenteId?: string; fechaInicio?: string; fechaFin?: string }): Promise<ExportData[]> => {
    const params = new URLSearchParams();
    if (filtros?.proyectoId) params.append("proyectoId", filtros.proyectoId);
    if (filtros?.agenteId) params.append("agenteId", filtros.agenteId);
    if (filtros?.fechaInicio) params.append("fechaInicio", filtros.fechaInicio);
    if (filtros?.fechaFin) params.append("fechaFin", filtros.fechaFin);
    const qs = params.toString();
    return safeFetch<ExportData[]>(`${BASE}/analytics/export${qs ? `?${qs}` : ""}`);
  },

  contactos: (page = 0, size = 100, proyectoId?: string, estado?: string): Promise<PaginatedResponse<Contacto>> => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (proyectoId) params.append("proyectoId", proyectoId);
    if (estado) params.append("estado", estado);
    return safeFetch<PaginatedResponse<Contacto>>(`${BASE}/admin/contacts?${params.toString()}`);
  },

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

  usuarios: (): Promise<Array<{ id: string; nombre: string; email: string; rol: string; activo: boolean }>> =>
    safeFetch(`${BASE}/usuarios`),

  agenteStats: (proyectoId?: string): Promise<any[]> =>
    safeFetch(`${BASE}/analytics/agents${proyectoId ? `?proyectoId=${proyectoId}` : ""}`),

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

  desbloquearContacto: (id: string): Promise<{ success: boolean }> =>
    safeFetch(`${BASE}/contacts/${id}/unlock`, { method: "POST" }),

  desbloquearContactosBulk: (proyectoId?: string, estado?: string): Promise<{ success: boolean; message: string; afectados: number }> => {
    const params = new URLSearchParams();
    if (proyectoId) params.append("proyectoId", proyectoId);
    if (estado) params.append("estado", estado);
    return safeFetch(`${BASE}/contacts/unlock-bulk?${params.toString()}`, { method: "POST" });
  },
};
