import { connection } from "next/server";
import Link from "next/link";
import { Suspense } from "react";
import { Carregando, Cartao, StatusRodadaBadge, Titulo, formatarData } from "@/components/ui";
import { db, verificar } from "@/lib/supabase";
import type { Rodada } from "@/lib/tipos";

// Histórico: as últimas 100 rodadas de todos os nichos.
export default function Historico() {
  return (
    <>
      <Titulo>Histórico de rodadas</Titulo>
      <Suspense fallback={<Carregando />}>
        <ListaRodadas />
      </Suspense>
    </>
  );
}

async function ListaRodadas() {
  await connection(); // lê o banco só quando alguém abre a página (nunca durante o build)
  const rodadas = verificar(
    await db().from("rodadas").select("*, nichos(nome)").order("iniciada_em", { ascending: false }).limit(100),
  ) as (Rodada & { nichos: { nome: string } | null })[];

  if (rodadas.length === 0) return <Cartao>Nenhuma rodada ainda.</Cartao>;

  return (
    <Cartao className="p-0">
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {rodadas.map((r) => (
          <li key={r.id}>
            <Link href={`/rodadas/${r.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
              <span className="w-36 text-zinc-500">{formatarData(r.iniciada_em)}</span>
              <span className="font-medium">{r.nichos?.nome}</span>
              <StatusRodadaBadge status={r.status} erro={r.erro} />
              <span className="ml-auto text-zinc-500">{r.totais.oportunidades ?? 0} oportunidades</span>
            </Link>
          </li>
        ))}
      </ul>
    </Cartao>
  );
}
