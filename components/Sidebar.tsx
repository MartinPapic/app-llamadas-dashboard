"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Phone, Users } from "lucide-react";

const links = [
  { href: "/",          label: "Dashboard", icon: LayoutDashboard },
  { href: "/contactos", label: "Contactos", icon: Users },
  { href: "/llamadas",  label: "Llamadas",  icon: Phone },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-56 min-h-screen bg-slate-900 text-white flex flex-col p-4 gap-1 shrink-0">
      <div className="text-lg font-bold mb-6 px-2 flex items-center gap-2">
        <span className="text-2xl">📞</span> App Llamadas
      </div>
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
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
    </aside>
  );
}
