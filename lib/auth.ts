const TOKEN_KEY = "admin_token";

export interface LoginResult {
  rol: string;
  nombre: string;
  userId: string;
}

/**
 * Llama al proxy interno de Next.js (/api/auth/login) que setea
 * el token como cookie HttpOnly desde el servidor.
 * El token NUNCA toca JavaScript del navegador.
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? `Error ${res.status}: credenciales inválidas`);
  }

  const data: LoginResult = await res.json();
  // Guardar metadata no sensible en localStorage (solo para UI, no para auth)
  if (typeof window !== "undefined") {
    localStorage.setItem("admin_rol", data.rol);
    localStorage.setItem("admin_nombre", data.nombre);
  }
  return data;
}

export async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  if (typeof window !== "undefined") {
    localStorage.removeItem("admin_rol");
    localStorage.removeItem("admin_nombre");
  }
}

export function getToken(): string | null {
  // El token ya no es accesible en el browser (HttpOnly)
  // Esta función solo se mantiene por compatibilidad con código existente
  return null;
}

export function getUserRol(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_rol");
}
