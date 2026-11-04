import "server-only";
import { z } from "zod";
import { MODELOS } from "@/config/modelos";
import { PARAMETROS } from "@/config/parametros";
import { gerarJson } from "@/lib/gemini";
import { db, verificar } from "@/lib/supabase";
import type { Comentario, Nicho, Rodada } from "@/lib/tipos";
import { PROMPT_EXTRACAO } from "@/prompts/extracao";
import { somarTotais, type ResultadoEtapa } from "./comum";

const nivel = z.enum(["baixa", "media", "alta"]);

const schemaResposta = z.object({
  necessidades: z.array(
    z.object({
      comentario: z.number(),
      descricao: z.string(),
      tipo: z.enum(["reclamacao", "desejo", "frustracao", "pergunta", "lacuna"]),
      intensidade: nivel,
      quem_tem: z.string(),
      solucao_atual: z.string().nullable(),
      sinal_pagamento: z.boolean(),
      valor_mencionado: z.number().nullable(),
      especificidade: nivel,
    }),
  ),
});

// Etapa 2: manda os comentários ainda não processados para a IA, em lotes,
// e salva as necessidades encontradas ligadas ao comentário de origem.
export async function extrair(rodada: Rodada, prazo: number): Promise<ResultadoEtapa> {
  const nicho = verificar(await db().from("nichos").select("*").eq("id", rodada.nicho_id).single()) as Nicho;
  const foco = nicho.foco?.trim() ? `\nFoco especial desta análise: ${nicho.foco.trim()}\n` : "";

  while (Date.now() < prazo) {
    const lote = verificar(
      await db()
        .from("comentarios")
        .select("*")
        .eq("nicho_id", rodada.nicho_id)
        .eq("processado", false)
        .order("coletado_em")
        .limit(PARAMETROS.comentariosPorLote),
    ) as Comentario[];
    if (lote.length === 0) return { concluiu: true };

    // Os comentários vão numerados a partir de 1; a IA devolve o número de origem de cada necessidade.
    const textoComentarios = lote
      .map((c, i) => `[${i + 1}] (vídeo: ${c.video_titulo ?? "?"}) ${c.texto.replace(/\s+/g, " ")}`)
      .join("\n");
    const prompt = PROMPT_EXTRACAO.replace("{{FOCO}}", foco).replace("{{COMENTARIOS}}", textoComentarios);

    const resposta = await gerarJson(MODELOS.extracao, prompt, schemaResposta);

    const linhas = resposta.necessidades
      .filter((n) => Number.isInteger(n.comentario) && n.comentario >= 1 && n.comentario <= lote.length)
      .map((n) => ({
        nicho_id: rodada.nicho_id,
        comentario_id: lote[n.comentario - 1].id,
        descricao: n.descricao,
        tipo: n.tipo,
        intensidade: n.intensidade,
        quem_tem: n.quem_tem,
        solucao_atual: n.solucao_atual,
        sinal_pagamento: n.sinal_pagamento,
        valor_mencionado: n.valor_mencionado,
        especificidade: n.especificidade,
      }));

    if (linhas.length > 0) verificar(await db().from("necessidades").insert(linhas));
    verificar(
      await db()
        .from("comentarios")
        .update({ processado: true })
        .in("id", lote.map((c) => c.id)),
    );
    await somarTotais(rodada, { comentariosProcessados: lote.length, necessidadesNovas: linhas.length });
  }

  return { concluiu: false };
}
