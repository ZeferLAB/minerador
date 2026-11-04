import type { ReactNode } from "react";
import type { StatusRodada } from "@/lib/tipos";

// Peças visuais pequenas, reutilizadas em várias telas.

export function Cartao({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 ${className}`}>{children}</div>;
}

export function Titulo({ children }: { children: ReactNode }) {
  return <h1 className="mb-6 text-2xl font-semibold">{children}</h1>;
}

export function Carregando() {
  return <p className="text-sm text-zinc-500">Carregando…</p>;
}

export function Nota({ valor }: { valor: number }) {
  const cor =
    valor >= 8 ? "bg-emerald-600" : valor >= 6 ? "bg-lime-600" : valor >= 4 ? "bg-amber-500" : "bg-zinc-400";
  return (
    <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${cor}`}>
      {valor}
    </span>
  );
}

export const ROTULO_STATUS: Record<StatusRodada, string> = {
  coletando: "Coletando comentários",
  extraindo: "Extraindo necessidades",
  agrupando: "Agrupando",
  pontuando: "Dando notas",
  concluida: "Concluída",
};

export function StatusRodadaBadge({ status, erro }: { status: StatusRodada; erro?: string | null }) {
  const cor = erro
    ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
    : status === "concluida"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
      : "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300";
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${cor}`}>
      {erro ? "Com erro" : ROTULO_STATUS[status]}
    </span>
  );
}

export function formatarData(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const estiloBotao =
  "rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300";
export const estiloBotaoSecundario =
  "rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800";
export const estiloCampo =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950";
