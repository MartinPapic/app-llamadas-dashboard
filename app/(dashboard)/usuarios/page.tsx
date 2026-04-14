"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Shield, User } from "lucide-react";
import { getToken } from "@/lib/auth"; // Adivinando el path. Si falla, reviso.

type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"crear" | "editar">("crear");
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);

  // Form states
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("agente");
  const [isSaving, setIsSaving] = useState(false);

  const apiBaseUrl = "/api/proxy";

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/usuarios`, {
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (!res.ok) throw new Error("Error al obtener usuarios");
      const data = await res.json();
      setUsuarios(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const openCrear = () => {
    setModalMode("crear");
    setSelectedUsuario(null);
    setNombre("");
    setEmail("");
    setPassword("");
    setRol("agente");
    setIsModalOpen(true);
  };

  const openEditar = (u: Usuario) => {
    setModalMode("editar");
    setSelectedUsuario(u);
    setNombre(u.nombre);
    setEmail(u.email);
    setPassword(""); // Vacio para no actualizar si no se escribe nada
    setRol(u.rol);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const url =
        modalMode === "crear"
          ? `${apiBaseUrl}/usuarios`
          : `${apiBaseUrl}/usuarios/${selectedUsuario?.id}`;
      const method = modalMode === "crear" ? "POST" : "PUT";

      const payload = {
        nombre,
        email,
        password: password || undefined,
        rol,
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Error al guardar el usuario");
      }

      await fetchUsuarios();
      closeModal();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario ${email}?`)) return;
    try {
      const res = await fetch(`${apiBaseUrl}/usuarios/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Error al eliminar el usuario");
      }
      
      await fetchUsuarios();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading && usuarios.length === 0) {
    return <div className="p-8">Cargando usuarios...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-slate-500 mt-1">
            Administra a los agentes y administradores del sistema.
          </p>
        </div>
        <button
          onClick={openCrear}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
        >
          <Plus className="h-4 w-4" />
          Agregar Usuario
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Nombre</th>
              <th className="px-6 py-4">Correo</th>
              <th className="px-6 py-4">Rol</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuarios.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{u.nombre}</td>
                <td className="px-6 py-4 text-slate-500">{u.email}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                      ${
                        u.rol === "admin"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                  >
                    {u.rol === "admin" ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                    {u.rol.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditar(u)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id, u.email)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  No hay usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold">
                {modalMode === "crear" ? "Nuevo Usuario" : "Editar Usuario"}
              </h3>
            </div>
            
            <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Nombre</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Contraseña {modalMode === "editar" && <span className="text-slate-400 font-normal text-xs">(Dejar en blanco para mantener actual)</span>}
                </label>
                <input
                  type="password"
                  required={modalMode === "crear"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Rol</label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="agente">Agente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSaving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
