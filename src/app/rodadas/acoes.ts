"use server";

import { redirect } from "next/navigation";
import { exigirSessao } from "@/lib/auth";
import { criarRodada } from "@/pipeline/executar";

// Botão "Rodar agora": cria a rodada (ou reaproveita a que está em andamento) e abre a tela dela,
// que se encarrega de processar até o fim.
export async function rodarAgora(dados: FormData) {
  await exigirSessao();
  const rodada = await criarRodada(String(dados.get("nicho_id")));
  redirect(`/rodadas/${rodada.id}`);
}
