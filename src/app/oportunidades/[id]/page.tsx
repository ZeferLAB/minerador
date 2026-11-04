import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { Carregando, Cartao, Nota, formatarData } from "@/components/ui";
import { db, verificar } from "@/lib/supabase";
import type { Cluster, Comentario, Necessidade, Oportunidade } from "@/lib/tipos";

// Detalhe de uma oportunidade: avaliação da IA e os comentários originais (com link) que a sustentam.
export default function PaginaOportunidade({ params }: PageProps<"/oportunidades/[id]">) {
  return (
    <Suspense fallback={<Carregando />}>
      <ConteudoOportunidade params={params} />
    </Suspense>
  );
}

async function ConteudoOportunidade({ params }: { params: Promise<{ id: string }> }) {
  await connection(); // lê o banco só quando alguém abre a página (nunca durante o build)
  const { id } = await params;
  const oportunidade = verificar(await db().from("oportunidades").select("*").eq("id", id).maybeSingle()) as Oportunidade | null;
  if (!oportunidade) notFound();

  const grupo = verificar(await db().from("clusters").select("*").eq("id", oportunidade.cluster_id).single()) as Cluster;
  const ligacoes = verificar(
    await db().from("cluster_necessidades").select("necessidade_id").eq("cluster_id", grupo.id).limit(100),
  ) as { necessidade_id: string }[];
  const necessidades = verificar(
    await db().from("necessidades").select("*").in("id", ligacoes.map((l) => l.necessidade_id)),
  ) as Necessidade[];
  const comentarios = verificar(
    await db().from("comentarios").select("*").in("id", necessidades.map((n) => n.comentario_id)),
  ) as Comentario[];

  return (
    <div className="space-y-6">
      <Link href={`/rodadas/${grupo.rodada_id}`} className="text-sm text-zinc-500 hover:underline">
        ← Voltar para a rodada
      </Link>

      <div className="flex gap-4">
        <Nota valor={oportunidade.nota} />
        <div>
          <h1 className="text-2xl font-semibold">{grupo.necessidade_unificada}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {grupo.publico_alvo} · {grupo.ocorrencias} menções · {grupo.qtd_pagaria} indicam que pagariam
          </p>
        </div>
      </div>

      <Cartao className="space-y-4 text-sm">
        <Campo titulo="Avaliação">{oportunidade.raciocinio}</Campo>
        <Campo titulo="Direção de produto">{oportunidade.direcao_produto}</Campo>
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo titulo="Preço estimado">{oportunidade.preco_estimado ?? "—"}</Campo>
          <Campo titulo="Complexidade">{oportunidade.complexidade}</Campo>
          <Campo titulo="Primeiros clientes">{oportunidade.canal_primeiros_clientes}</Campo>
        </div>
        <Campo titulo="Soluções que já existem">
          <Lista itens={oportunidade.solucoes_existentes} />
        </Campo>
        <Campo titulo="Por que não bastam">{oportunidade.por_que_falham}</Campo>
        <Campo titulo="Red flags">
          <Lista itens={oportunidade.red_flags} />
        </Campo>
      </Cartao>

      <Cartao>
        <h2 className="mb-1 font-semibold">Comentários originais ({necessidades.length})</h2>
        <p className="mb-3 text-sm text-zinc-500">
          Leia as fontes antes de decidir: a nota é uma triagem, não uma validação.
        </p>
        <ul className="space-y-4 text-sm">
          {necessidades.map((n) => {
            const c = comentarios.find((c) => c.id === n.comentario_id);
            return (
              <li key={n.id} className="border-l-2 border-zinc-300 pl-3 dark:border-zinc-700">
                <p className="font-medium">
                  {n.descricao}
                  {n.sinal_pagamento && <span className="ml-2 rounded bg-emerald-100 px-1.5 text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">pagaria</span>}
                </p>
                {c && (
                  <>
                    <p className="mt-1 whitespace-pre-line text-zinc-600 dark:text-zinc-400">“{c.texto}”</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {c.autor} · {formatarData(c.publicado_em)} · {c.video_titulo} ·{" "}
                      <a href={c.url} target="_blank" rel="noreferrer" className="underline">
                        abrir no YouTube
                      </a>
                    </p>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </Cartao>
    </div>
  );
}

function Campo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">{titulo}</h3>
      <div>{children}</div>
    </div>
  );
}

function Lista({ itens }: { itens: string[] }) {
  if (itens.length === 0) return <>—</>;
  return (
    <ul className="list-disc space-y-0.5 pl-5">
      {itens.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
