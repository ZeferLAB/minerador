import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { MODELOS } from "@/config/modelos";
import { PARAMETROS } from "@/config/parametros";
import { gerarJson } from "@/lib/gemini";
import { db, verificar } from "@/lib/supabase";
import type { Necessidade, Rodada } from "@/lib/tipos";
import { PROMPT_AGRUPAMENTO } from "@/prompts/agrupamento";
import { emPedacos, somarTotais, type ResultadoEtapa } from "./comum";

const schemaResposta = z.object({
  grupos: z.array(
    z.object({
      necessidade_unificada: z.string(),
      publico_alvo: z.string(),
      tipo_dominante: z.enum(["reclamacao", "desejo", "frustracao", "pergunta", "lacuna"]),
      itens: z.array(z.number()),
    }),
  ),
});

// Etapa 3: junta as necessidades recentes do nicho em grupos da mesma dor.
// A IA só diz quais itens formam cada grupo; as contagens são feitas aqui no código (exatas).
export async function agrupar(rodada: Rodada): Promise<ResultadoEtapa> {
  const desde = new Date(Date.now() - PARAMETROS.janelaDias * 24 * 60 * 60 * 1000).toISOString();
  const necessidades = verificar(
    await db()
      .from("necessidades")
      .select("*")
      .eq("nicho_id", rodada.nicho_id)
      .gte("criado_em", desde)
      .order("criado_em", { ascending: false })
      .limit(PARAMETROS.maxNecessidadesNoAgrupamento),
  ) as Necessidade[];

  // Se a etapa for repetida (ex.: caiu no meio), apaga os grupos da tentativa anterior.
  verificar(await db().from("clusters").delete().eq("rodada_id", rodada.id));

  if (necessidades.length === 0) {
    await somarTotais(rodada, { necessidadesAgrupadas: 0, grupos: 0 });
    return { concluiu: true };
  }

  const texto = necessidades
    .map((n, i) => `[${i + 1}] (${n.tipo}/${n.intensidade}) ${n.descricao} (quem: ${n.quem_tem ?? "?"})`)
    .join("\n");
  const resposta = await gerarJson(
    MODELOS.agrupamento,
    PROMPT_AGRUPAMENTO.replace("{{NECESSIDADES}}", texto),
    schemaResposta,
  );

  const usados = new Set<number>();
  const grupos = resposta.grupos
    .map((g) => {
      const itens = g.itens.filter((i) => Number.isInteger(i) && i >= 1 && i <= necessidades.length && !usados.has(i));
      itens.forEach((i) => usados.add(i));
      const membros = itens.map((i) => necessidades[i - 1]);
      return {
        id: randomUUID(),
        rodada_id: rodada.id,
        necessidade_unificada: g.necessidade_unificada,
        publico_alvo: g.publico_alvo,
        tipo_dominante: g.tipo_dominante,
        ocorrencias: membros.length,
        qtd_pagaria: membros.filter((m) => m.sinal_pagamento).length,
        membros,
      };
    })
    .filter((g) => g.ocorrencias > 0)
    .sort((a, b) => b.ocorrencias - a.ocorrencias);

  if (grupos.length > 0) {
    const linhas = grupos.map((g) => ({
      id: g.id,
      rodada_id: g.rodada_id,
      necessidade_unificada: g.necessidade_unificada,
      publico_alvo: g.publico_alvo,
      tipo_dominante: g.tipo_dominante,
      ocorrencias: g.ocorrencias,
      qtd_pagaria: g.qtd_pagaria,
    }));
    verificar(await db().from("clusters").insert(linhas));
    const ligacoes = grupos.flatMap((g) => g.membros.map((m) => ({ cluster_id: g.id, necessidade_id: m.id })));
    for (const pedaco of emPedacos(ligacoes, 500)) {
      verificar(await db().from("cluster_necessidades").insert(pedaco));
    }
  }

  rodada.totais.necessidadesAgrupadas = 0;
  rodada.totais.grupos = 0;
  await somarTotais(rodada, { necessidadesAgrupadas: usados.size, grupos: grupos.length });
  return { concluiu: true };
}
