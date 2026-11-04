import "server-only";
import { z } from "zod";
import { MODELOS } from "@/config/modelos";
import { PARAMETROS } from "@/config/parametros";
import { gerarJson } from "@/lib/gemini";
import { db, verificar } from "@/lib/supabase";
import type { Cluster, Comentario, Necessidade, Rodada } from "@/lib/tipos";
import { PROMPT_PONTUACAO } from "@/prompts/pontuacao";
import { somarTotais, type ResultadoEtapa } from "./comum";

const schemaResposta = z.object({
  nota: z.number(),
  raciocinio: z.string(),
  solucoes_existentes: z.array(z.string()),
  por_que_falham: z.string(),
  direcao_produto: z.string(),
  preco_estimado: z.string().nullable(),
  canal_primeiros_clientes: z.string(),
  complexidade: z.enum(["baixa", "media", "alta"]),
  red_flags: z.array(z.string()),
});

// Etapa 4: avalia os maiores grupos como oportunidade de negócio (um grupo por chamada).
// Só entram grupos com pelo menos PARAMETROS.minimoMencoesParaNota menções.
// Grupos que já têm nota são pulados, então a etapa pode ser retomada a qualquer momento.
export async function pontuar(rodada: Rodada, prazo: number): Promise<ResultadoEtapa> {
  const grupos = verificar(
    await db()
      .from("clusters")
      .select("*")
      .eq("rodada_id", rodada.id)
      .gte("ocorrencias", PARAMETROS.minimoMencoesParaNota)
      .order("ocorrencias", { ascending: false })
      .limit(PARAMETROS.gruposParaPontuar),
  ) as Cluster[];
  if (grupos.length === 0) return { concluiu: true };

  const jaPontuados = verificar(
    await db().from("oportunidades").select("cluster_id").in("cluster_id", grupos.map((g) => g.id)),
  ) as { cluster_id: string }[];
  const pendentes = grupos.filter((g) => !jaPontuados.some((p) => p.cluster_id === g.id));

  for (const grupo of pendentes) {
    if (Date.now() > prazo) return { concluiu: false };

    const ligacoes = verificar(
      await db()
        .from("cluster_necessidades")
        .select("necessidade_id")
        .eq("cluster_id", grupo.id)
        .limit(PARAMETROS.exemplosPorGrupo),
    ) as { necessidade_id: string }[];
    const necessidades = verificar(
      await db().from("necessidades").select("*").in("id", ligacoes.map((l) => l.necessidade_id)),
    ) as Necessidade[];
    const comentarios = verificar(
      await db().from("comentarios").select("id, texto").in("id", necessidades.map((n) => n.comentario_id)),
    ) as Pick<Comentario, "id" | "texto">[];

    const exemplos = necessidades
      .map((n) => {
        const original = comentarios.find((c) => c.id === n.comentario_id)?.texto.replace(/\s+/g, " ") ?? "";
        return `- [${n.tipo}${n.sinal_pagamento ? ", pagaria" : ""}] ${n.descricao}\n  Comentário: "${original}"`;
      })
      .join("\n");
    const descricaoGrupo = JSON.stringify(
      {
        necessidade: grupo.necessidade_unificada,
        publico_alvo: grupo.publico_alvo,
        tipo_dominante: grupo.tipo_dominante,
        ocorrencias: grupo.ocorrencias,
        quantos_indicam_que_pagariam: grupo.qtd_pagaria,
      },
      null,
      2,
    );

    const avaliacao = await gerarJson(
      MODELOS.pontuacao,
      PROMPT_PONTUACAO.replace("{{GRUPO}}", descricaoGrupo).replace("{{EXEMPLOS}}", exemplos),
      schemaResposta,
    );

    verificar(
      await db()
        .from("oportunidades")
        .insert({
          cluster_id: grupo.id,
          ...avaliacao,
          nota: Math.min(10, Math.max(1, Math.round(avaliacao.nota))),
        }),
    );
    await somarTotais(rodada, { oportunidades: 1 });
  }

  return { concluiu: true };
}
