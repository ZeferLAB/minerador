import { NextResponse, type NextRequest } from "next/server";
import { PARAMETROS } from "@/config/parametros";
import { mensagemDeErro } from "@/lib/erros";
import { db, verificar } from "@/lib/supabase";
import type { Nicho, Rodada } from "@/lib/tipos";
import { criarRodada, executarRodada } from "@/pipeline/executar";

// Chamado pela Vercel uma vez por dia (agenda em vercel.json). Para cada nicho ativo:
// - se há rodada em andamento, continua;
// - senão, se a última começou há mais de N dias (PARAMETROS.diasEntreRodadas), cria uma nova.
// O resultado aparece nos logs da Vercel (Project > Logs).
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }
  try {
    const relatorio = await processarNichos();
    console.log("Cron diário:", relatorio);
    return NextResponse.json(relatorio);
  } catch (erro) {
    console.error("Cron diário falhou:", erro);
    return NextResponse.json({ erro: mensagemDeErro(erro) }, { status: 500 });
  }
}

async function processarNichos(): Promise<Record<string, string>> {
  const prazo = Date.now() + PARAMETROS.orcamentoPorExecucaoMs;
  const nichos = verificar(await db().from("nichos").select("*").eq("ativo", true)) as Nicho[];
  const relatorio: Record<string, string> = {};

  for (const nicho of nichos) {
    if (Date.now() > prazo) {
      relatorio[nicho.nome] = "sem tempo hoje, fica para amanhã";
      continue;
    }
    const [ultima] = verificar(
      await db().from("rodadas").select("*").eq("nicho_id", nicho.id).order("iniciada_em", { ascending: false }).limit(1),
    ) as Rodada[];

    const intervaloMs = PARAMETROS.diasEntreRodadas * 24 * 60 * 60 * 1000;
    const precisaNova = !ultima || (ultima.status === "concluida" && Date.now() - Date.parse(ultima.iniciada_em) >= intervaloMs);
    if (ultima?.status === "concluida" && !precisaNova) {
      relatorio[nicho.nome] = "nada a fazer";
      continue;
    }

    const rodada = precisaNova ? await criarRodada(nicho.id) : ultima;
    const resultado = await executarRodada(rodada.id, prazo);
    relatorio[nicho.nome] =
      resultado.situacao === "ocupada" ? "rodada já em execução"
      : resultado.situacao === "erro" ? `erro: ${resultado.rodada.erro}`
      : `${resultado.situacao} (etapa: ${resultado.rodada.status})`;
  }

  return relatorio;
}
