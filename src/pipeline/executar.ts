import "server-only";
import { PARAMETROS } from "@/config/parametros";
import { ErroAmigavel, mensagemDeErro } from "@/lib/erros";
import { db, verificar } from "@/lib/supabase";
import type { Rodada, StatusRodada } from "@/lib/tipos";
import { agrupar } from "./agrupar";
import { coletar } from "./coletar";
import { extrair } from "./extrair";
import { pontuar } from "./pontuar";

// "Máquina de etapas": cada rodada passa por coletando → extraindo → agrupando → pontuando → concluida.
// Cada chamada faz o máximo que cabe no tempo, salva o progresso no banco e para.
// A chamada seguinte continua de onde parou. Se der erro, a mensagem fica salva e a rodada
// continua na mesma etapa, pronta para "Tentar de novo".

const PROXIMA: Record<Exclude<StatusRodada, "concluida">, StatusRodada> = {
  coletando: "extraindo",
  extraindo: "agrupando",
  agrupando: "pontuando",
  pontuando: "concluida",
};

export type ResultadoExecucao =
  | { situacao: "concluida" | "pendente" | "erro"; rodada: Rodada }
  | { situacao: "ocupada" };

export async function executarRodada(
  rodadaId: string,
  prazo = Date.now() + PARAMETROS.orcamentoPorExecucaoMs,
): Promise<ResultadoExecucao> {
  // Trava a rodada por 6 minutos para que duas execuções não rodem ao mesmo tempo
  // (ex.: duas abas abertas, ou o cron junto com o botão).
  const agora = new Date().toISOString();
  const rodada = verificar(
    await db()
      .from("rodadas")
      .update({ bloqueada_ate: new Date(Date.now() + 6 * 60_000).toISOString(), erro: null })
      .eq("id", rodadaId)
      .or(`bloqueada_ate.is.null,bloqueada_ate.lt."${agora}"`)
      .select()
      .maybeSingle(),
  ) as Rodada | null;
  if (!rodada) return { situacao: "ocupada" };

  try {
    while (rodada.status !== "concluida") {
      const etapa = rodada.status;
      // Agrupar é uma chamada grande à IA: só começa se ainda sobrar bastante tempo.
      if (etapa === "agrupando" && Date.now() > prazo - 60_000) break;

      const resultado =
        etapa === "coletando" ? await coletar(rodada, prazo)
        : etapa === "extraindo" ? await extrair(rodada, prazo)
        : etapa === "agrupando" ? await agrupar(rodada)
        : await pontuar(rodada, prazo);

      if (!resultado.concluiu) break;

      rodada.status = PROXIMA[etapa];
      const concluidaEm = rodada.status === "concluida" ? new Date().toISOString() : null;
      verificar(
        await db().from("rodadas").update({ status: rodada.status, concluida_em: concluidaEm }).eq("id", rodada.id),
      );
      if (Date.now() > prazo) break;
    }
  } catch (erro) {
    if (!(erro instanceof ErroAmigavel)) console.error(erro);
    rodada.erro = mensagemDeErro(erro);
    await db().from("rodadas").update({ erro: rodada.erro, bloqueada_ate: null }).eq("id", rodada.id);
    return { situacao: "erro", rodada };
  }

  await db().from("rodadas").update({ bloqueada_ate: null }).eq("id", rodada.id);
  return { situacao: rodada.status === "concluida" ? "concluida" : "pendente", rodada };
}

// Cria uma rodada nova, se o nicho não tiver outra em andamento.
export async function criarRodada(nichoId: string): Promise<Rodada> {
  const emAndamento = verificar(
    await db().from("rodadas").select("*").eq("nicho_id", nichoId).neq("status", "concluida").limit(1),
  ) as Rodada[];
  if (emAndamento.length > 0) return emAndamento[0];

  return verificar(await db().from("rodadas").insert({ nicho_id: nichoId }).select().single()) as Rodada;
}
