import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth"];

function isTokenInvalid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.rol?.toUpperCase() !== "ADMIN") {
      return true; // Rol no permitido en dashboard
    }
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true; // Token malformado → tratar como inválido
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("admin_token")?.value;

  if (!token || isTokenInvalid(token)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
