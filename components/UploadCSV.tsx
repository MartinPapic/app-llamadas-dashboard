"use client";

import { useState, useRef } from "react";
import { UploadCloud, CheckCircle, AlertCircle, Loader2, Download } from "lucide-react";
import { api, type Contacto } from "@/lib/api";

interface UploadCSVProps {
  onSuccess: () => void;
}

export function UploadCSV({ onSuccess }: UploadCSVProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Fetch agents to map emails to IDs
      const agentes = await api.agentes();
      const agentMap = new Map(agentes.map(a => [a.email.toLowerCase(), a.id]));

      // 2. Parse CSV
      const text = await file.text();
      const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
      
      if (lines.length < 2) throw new Error("El archivo está vacío o no tiene encabezados.");

      const headers = lines[0].toLowerCase().split(",");
      const expectedHeaders = ["nombre", "telefono"];
      
      const missing = expectedHeaders.filter(h => !headers.includes(h));
      if (missing.length > 0) {
        throw new Error(`Faltan columnas requeridas: ${missing.join(", ")}`);
      }

      const idxNombre = headers.indexOf("nombre");
      const idxTelefono = headers.indexOf("telefono");

      const nuevosContactos: Contacto[] = [];

      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(",");
        const nombre = columns[idxNombre]?.trim() || "Sin Nombre";
        const telefono = columns[idxTelefono]?.trim() || "";

        if (!telefono) continue; 

        nuevosContactos.push({
          id: crypto.randomUUID(),
          nombre,
          telefono,
          estado: "PENDIENTE",
          intentos: 0,
          fechaCreacion: Date.now(),
        });
      }

      if (nuevosContactos.length === 0) throw new Error("No se encontraron contactos válidos.");

      // 3. Upload to backend
      const res = await api.uploadContactos(nuevosContactos);
      setSuccess(`¡Éxito! Se importaron ${res.cantidad} contactos.`);
      
      // Cleanup
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => {
        setSuccess(null);
        onSuccess();
      }, 2000);

    } catch (err: any) {
      setError(err.message || "Error al procesar el archivo CSV.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "nombre,telefono\nJuan Perez,987654321\nMaria Lopez,912345678\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "plantilla_contactos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800 mb-2">Importar Contactos (Pool Global)</h3>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          Sube un archivo CSV con las columnas: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">nombre,telefono</code>
        </p>
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg"
        >
          <Download className="w-4 h-4" />
          Descargar Plantilla
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-4">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm mb-4">
          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="relative border-2 border-dashed border-slate-300 rounded-xl hover:bg-slate-50 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={loading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div className="flex flex-col items-center justify-center p-8 pointer-events-none">
          {loading ? (
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
          ) : (
            <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
          )}
          <span className="text-sm font-medium text-slate-700">
            {loading ? "Procesando..." : "Haz clic o arrastra un archivo CSV"}
          </span>
        </div>
      </div>
    </div>
  );
}
