import "server-only";
import { db, verificar } from "./supabase";
import type { Cluster, Oportunidade } from "./tipos";

// Consultas usadas por mais de uma tela.

export type OportunidadeComGrupo = Oportunidade & { grupo: Cluster };

// Oportunidades de uma rodada, da maior nota para a menor.
export async function oportunidadesDaRodada(rodadaId: string, limite?: number): Promise<OportunidadeComGrupo[]> {
  const grupos = verificar(await db().from("clusters").select("*").eq("rodada_id", rodadaId)) as Cluster[];
  if (grupos.length === 0) return [];
  const oportunidades = verificar(
    await db().from("oportunidades").select("*").in("cluster_id", grupos.map((g) => g.id)),
  ) as Oportunidade[];

  const lista = oportunidades
    .map((o) => ({ ...o, grupo: grupos.find((g) => g.id === o.cluster_id)! }))
    .sort((a, b) => b.nota - a.nota || b.grupo.ocorrencias - a.grupo.ocorrencias);
  return limite ? lista.slice(0, limite) : lista;
}
