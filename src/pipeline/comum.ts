import "server-only";
import { db, verificar } from "@/lib/supabase";
import type { Rodada, TotaisRodada } from "@/lib/tipos";

// Resultado de uma etapa: "concluiu" = terminou tudo; false = parou por falta de tempo e continua depois.
export type ResultadoEtapa = { concluiu: boolean };

// Soma valores aos contadores da rodada (ex.: { comentariosNovos: 30 }).
export async function somarTotais(rodada: Rodada, parcial: TotaisRodada): Promise<void> {
  for (const [chave, valor] of Object.entries(parcial) as [keyof TotaisRodada, number][]) {
    rodada.totais[chave] = (rodada.totais[chave] ?? 0) + valor;
  }
  verificar(await db().from("rodadas").update({ totais: rodada.totais }).eq("id", rodada.id));
}

// Divide uma lista em pedaços (o Supabase tem limite de tamanho por consulta).
export function emPedacos<T>(lista: T[], tamanho: number): T[][] {
  const pedacos: T[][] = [];
  for (let i = 0; i < lista.length; i += tamanho) pedacos.push(lista.slice(i, i + tamanho));
  return pedacos;
}
