"use client";

import { useActionState, type ReactNode } from "react";

// Formulário que chama uma Server Action e mostra a mensagem de erro ou sucesso que ela devolver.
export type EstadoAcao = { erro?: string; ok?: string } | null;

export function FormAcao({
  acao,
  children,
  className = "",
}: {
  acao: (estado: EstadoAcao, dados: FormData) => Promise<EstadoAcao>;
  children: ReactNode;
  className?: string;
}) {
  const [estado, executar, pendente] = useActionState(acao, null);
  return (
    <form action={executar} className={className}>
      <fieldset disabled={pendente} className="contents">
        {children}
      </fieldset>
      {pendente && <p className="mt-2 text-sm text-zinc-500">Salvando…</p>}
      {estado?.erro && <p className="mt-2 text-sm text-red-600">{estado.erro}</p>}
      {estado?.ok && <p className="mt-2 text-sm text-emerald-600">{estado.ok}</p>}
    </form>
  );
}
