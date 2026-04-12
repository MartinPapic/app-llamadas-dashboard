"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Llamada } from "@/lib/api";

const COLORS: Record<string, string> = {
  CONTESTA:    "#22c55e",
  NO_CONTESTA: "#ef4444",
  OCUPADO:     "#f59e0b",
  INVALIDO:    "#94a3b8",
  SIN_RESULTADO: "#6366f1",
};

const LABELS: Record<string, string> = {
  CONTESTA:     "Contesta",
  NO_CONTESTA:  "No Contesta",
  OCUPADO:      "Ocupado",
  INVALIDO:     "Inválido",
  SIN_RESULTADO: "Sin resultado",
};

export function LlamadasChart({ llamadas }: { llamadas: Llamada[] }) {
  const data = Object.entries(
    llamadas.reduce((acc, l) => {
      const key = l.resultado ?? "SIN_RESULTADO";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, label: LABELS[name] ?? name, value }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Sin datos de llamadas aún.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 5 }}>
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value) => [value, "Llamadas"]}
          labelFormatter={(label) => `Resultado: ${label}`}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={80}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name] ?? "#6366f1"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
