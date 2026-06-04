"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Phone, Users, LogOut, BarChart3, ClipboardCheck, Briefcase, Target } from "lucide-react";
import { logout } from "@/lib/auth";

const links = [
  { href: "/",          label: "Supervisor (En vivo)", icon: LayoutDashboard },
  { href: "/proyectos", label: "Proyectos", icon: Briefcase },
  { href: "/analytics/global", label: "Rendimiento", icon: BarChart3 },
  { href: "/analytics/metas", label: "Avance de Metas", icon: Target },
  { href: "/analytics/agents", label: "Productividad", icon: BarChart3 },
  { href: "/analytics/funnel", label: "Salud de Base", icon: BarChart3 },
  { href: "/contactos", label: "Directorio", icon: Users },
  { href: "/llamadas",  label: "Historial Crudo",  icon: Phone },
  { href: "/usuarios",  label: "Agentes",  icon: Users },
];

import { useState } from "react";

export function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const SidebarContent = () => (
    <>
      <div className="text-lg font-bold mb-6 px-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2"><span className="text-2xl">📞</span> App Llamadas</span>
        <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
          &times;
        </button>
      </div>

      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setIsMobileMenuOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
            ${path === href
              ? "bg-indigo-600 text-white font-medium"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </Link>
      ))}

      {/* Spacer */}
      <div className="flex-1 min-h-[20px]" />

      {/* Logout */}
      <button
        id="sidebar-logout"
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400
                   hover:bg-red-900/40 hover:text-red-300 transition-colors w-full text-left mt-auto"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        Cerrar sesión
      </button>
    </>
  );

  return (
    <>
      {/* Mobile Top Nav */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 text-white px-4 py-3 shrink-0">
        <div className="text-lg font-bold flex items-center gap-2">
          <span className="text-xl">📞</span> App Llamadas
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md hover:bg-slate-800 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/80 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container (Desktop & Mobile) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col p-4 gap-1
        transition-transform duration-300 ease-in-out
        md:relative md:w-56 md:translate-x-0 md:min-h-screen shrink-0
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <SidebarContent />
      </aside>
    </>
  );
}
