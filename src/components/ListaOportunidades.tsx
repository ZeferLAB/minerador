import Link from "next/link";
import type { OportunidadeComGrupo } from "@/lib/consultas";
import { Nota } from "./ui";

export function ListaOportunidades({ itens }: { itens: OportunidadeComGrupo[] }) {
  if (itens.length === 0) return <p className="text-sm text-zinc-500">Nenhuma oportunidade avaliada ainda.</p>;
  return (
    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {itens.map((o) => (
        <li key={o.id}>
          <Link href={`/oportunidades/${o.id}`} className="flex gap-3 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
            <Nota valor={o.nota} />
            <div className="min-w-0">
              <p className="font-medium">{o.grupo.necessidade_unificada}</p>
              <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{o.direcao_produto}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {o.grupo.ocorrencias} menções · {o.grupo.qtd_pagaria} indicam que pagariam · complexidade {o.complexidade}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
