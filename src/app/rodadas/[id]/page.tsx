import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ContinuarRodada } from "@/components/ContinuarRodada";
import { ListaOportunidades } from "@/components/ListaOportunidades";
import { Carregando, Cartao, ROTULO_STATUS, formatarData } from "@/components/ui";
import { oportunidadesDaRodada } from "@/lib/consultas";
import { db, verificar } from "@/lib/supabase";
import type { Cluster, Rodada, StatusRodada } from "@/lib/tipos";

// Relatório de uma rodada: progresso, números, oportunidades com nota e demais grupos encontrados.
export default function PaginaRodada({ params }: PageProps<"/rodadas/[id]">) {
  return (
    <Suspense fallback={<Carregando />}>
      <ConteudoRodada params={params} />
    </Suspense>
  );
}

const ETAPAS: StatusRodada[] = ["coletando", "extraindo", "agrupando", "pontuando", "concluida"];

async function ConteudoRodada({ params }: { params: Promise<{ id: string }> }) {
  await connection(); // lê o banco só quando alguém abre a página (nunca durante o build)
  const { id } = await params;
  const rodada = verificar(
    await db().from("rodadas").select("*, nichos(nome)").eq("id", id).maybeSingle(),
  ) as (Rodada & { nichos: { nome: string } | null }) | null;
  if (!rodada) notFound();

  const oportunidades = await oportunidadesDaRodada(rodada.id);
  const outrosGrupos = (
    verificar(
      await db().from("clusters").select("*").eq("rodada_id", rodada.id).order("ocorrencias", { ascending: false }).limit(40),
    ) as Cluster[]
  ).filter((g) => !oportunidades.some((o) => o.cluster_id === g.id));

  const etapaAtual = ETAPAS.indexOf(rodada.status);
  const t = rodada.totais;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{rodada.nichos?.nome}</h1>
        <p className="text-sm text-zinc-500">
          Iniciada em {formatarData(rodada.iniciada_em)}
          {rodada.concluida_em && ` · concluída em ${formatarData(rodada.concluida_em)}`}
        </p>
      </div>

      <Cartao className="space-y-4">
        <ol className="flex flex-wrap gap-2 text-xs">
          {ETAPAS.map((etapa, i) => (
            <li
              key={etapa}
              className={`rounded-full px-3 py-1 ${
                i < etapaAtual || rodada.status === "concluida"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : i === etapaAtual
                    ? rodada.erro
                      ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                      : "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
              }`}
            >
              {ROTULO_STATUS[etapa]}
            </li>
          ))}
        </ol>

        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Numero rotulo="Vídeos lidos" valor={t.videos} />
          <Numero rotulo="Comentários novos" valor={t.comentariosNovos} />
          <Numero rotulo="Comentários analisados" valor={t.comentariosProcessados} />
          <Numero rotulo="Necessidades novas" valor={t.necessidadesNovas} />
          <Numero rotulo="Necessidades agrupadas" valor={t.necessidadesAgrupadas} />
          <Numero rotulo="Grupos" valor={t.grupos} />
          <Numero rotulo="Oportunidades avaliadas" valor={t.oportunidades} />
        </dl>

        {rodada.erro && <p className="rounded bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{rodada.erro}</p>}
        {rodada.status !== "concluida" && <ContinuarRodada rodadaId={rodada.id} comErro={!!rodada.erro} />}
      </Cartao>

      <Cartao>
        <h2 className="mb-2 font-semibold">Oportunidades</h2>
        <ListaOportunidades itens={oportunidades} />
      </Cartao>

      {outrosGrupos.length > 0 && (
        <Cartao>
          <h2 className="mb-2 font-semibold">Outros grupos encontrados (sem nota)</h2>
          <ul className="space-y-1 text-sm">
            {outrosGrupos.map((g) => (
              <li key={g.id} className="flex gap-2">
                <span className="w-8 shrink-0 text-right text-zinc-500">{g.ocorrencias}×</span>
                <span>{g.necessidade_unificada}</span>
              </li>
            ))}
          </ul>
        </Cartao>
      )}
    </div>
  );
}

function Numero({ rotulo, valor }: { rotulo: string; valor?: number }) {
  return (
    <div>
      <dt className="text-zinc-500">{rotulo}</dt>
      <dd className="text-lg font-semibold">{valor ?? 0}</dd>
    </div>
  );
}
