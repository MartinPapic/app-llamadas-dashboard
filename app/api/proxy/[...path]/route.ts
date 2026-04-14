import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Variable de servidor (sin NEXT_PUBLIC_) — nunca expuesta al browser
const RAW_BACKEND = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const BACKEND = RAW_BACKEND.endsWith("/") ? RAW_BACKEND.slice(0, -1) : RAW_BACKEND;

async function proxyRequest(
  request: NextRequest,
  params: { path: string[] }
): Promise<NextResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const backendPath = params.path.join("/");

  // Bloquear rutas sensibles o de agentes que no deben ser accedidas vía proxy del dashboard
  const BLOCKED_PREFIXES = ["auth/login", "auth/register", "contacts", "contactos", "calls", "sync", "encuestas"];
  if (BLOCKED_PREFIXES.some(prefix => backendPath === prefix || backendPath.startsWith(`${prefix}/`))) {
    console.log(`[Proxy] BLOCKED internally by Next.js rules: ${backendPath}`);
    return NextResponse.json({ error: "Ruta de API prohibida" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  const targetUrl = `${BACKEND}/${backendPath}${qs ? `?${qs}` : ""}`;

  let body: string | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.text();
  }

  try {
    const backendRes = await fetch(targetUrl, {
      method: request.method,
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body,
    });

    if (backendRes.status === 403) {
      console.log(`[Proxy] El backend devolvió 403 para backendPath=${backendPath}, URL completa=${targetUrl}`);
    }

    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err: any) {
    console.error(`[Proxy] Excepción en fetch hacia ${targetUrl}:`, err);
    return NextResponse.json(
      { error: "Error de conexión con el backend" },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await ctx.params);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await ctx.params);
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await ctx.params);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, await ctx.params);
}
