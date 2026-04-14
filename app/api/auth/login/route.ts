import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("[login] Calling backend:", `${BACKEND}/auth/login`);
    const backendRes = await fetch(`${BACKEND}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    console.log("[login] Backend status:", backendRes.status);

    const rawText = await backendRes.text();
    console.log("[login] Backend raw response:", rawText.slice(0, 200));

    let data: any = {};
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      return NextResponse.json(
        { error: "El servidor respondió con formato inválido", detalle: rawText.slice(0, 200) },
        { status: 502 }
      );
    }

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    if (data.rol?.toLowerCase() !== "admin") {
      return NextResponse.json(
        { error: "Acceso denegado: Solo administradores" },
        { status: 403 }
      );
    }

    const response = NextResponse.json({
      rol: data.rol,
      nombre: data.nombre,
      userId: data.userId,
      // No devolvemos el token al frontend: queda solo en la cookie HttpOnly
    });

    // Cookie HttpOnly: inaccesible desde JavaScript del navegador
    response.cookies.set("admin_token", data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 8 * 60 * 60, // 8 horas (igual que jwt.expiration-ms)
    });

    // Refresh token también HttpOnly, con vida 7 días
    response.cookies.set("admin_refresh_token", data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 días
    });

    return response;
  } catch (error: any) {
    console.error("Fetch API error:", error);
    return NextResponse.json(
      { error: "Error de conexión con el servidor", detalle: error.message },
      { status: 502 }
    );
  }
}
