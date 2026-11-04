"use server";

import { refresh } from "next/cache";
import type { EstadoAcao } from "@/components/FormAcao";
import { resolverFonte } from "@/fontes/youtube";
import { exigirSessao } from "@/lib/auth";
import { mensagemDeErro } from "@/lib/erros";
import { db, verificar } from "@/lib/supabase";

// Ações da tela de Configurações. Toda ação começa com exigirSessao():
// Server Actions podem ser chamadas diretamente, sem passar pelo login.

export async function criarNicho(_estado: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  await exigirSessao();
  const nome = String(dados.get("nome") ?? "").trim();
  if (!nome) return { erro: "Informe o nome do nicho." };
  try {
    verificar(await db().from("nichos").insert({ nome, foco: String(dados.get("foco") ?? "").trim() || null }));
  } catch (erro) {
    return { erro: mensagemDeErro(erro) };
  }
  refresh();
  return { ok: "Nicho criado." };
}

export async function salvarNicho(_estado: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  await exigirSessao();
  const nome = String(dados.get("nome") ?? "").trim();
  if (!nome) return { erro: "O nome não pode ficar vazio." };
  try {
    verificar(
      await db()
        .from("nichos")
        .update({
          nome,
          foco: String(dados.get("foco") ?? "").trim() || null,
          ativo: dados.get("ativo") === "on",
        })
        .eq("id", String(dados.get("id"))),
    );
  } catch (erro) {
    return { erro: mensagemDeErro(erro) };
  }
  refresh();
  return { ok: "Salvo." };
}

export async function excluirNicho(dados: FormData) {
  await exigirSessao();
  verificar(await db().from("nichos").delete().eq("id", String(dados.get("id"))));
  refresh();
}

export async function adicionarFonte(_estado: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  await exigirSessao();
  const nichoId = String(dados.get("nicho_id"));
  try {
    const fonte = await resolverFonte(String(dados.get("link") ?? ""));
    const { error } = await db().from("fontes").insert({ nicho_id: nichoId, ...fonte });
    if (error?.code === "23505") return { erro: "Essa fonte já está cadastrada neste nicho." };
    if (error) return { erro: `Erro no banco de dados: ${error.message}` };
    refresh();
    return { ok: `Adicionado: ${fonte.titulo}` };
  } catch (erro) {
    return { erro: mensagemDeErro(erro) };
  }
}

export async function alternarFonte(dados: FormData) {
  await exigirSessao();
  verificar(
    await db()
      .from("fontes")
      .update({ ativo: dados.get("ativo") !== "true" })
      .eq("id", String(dados.get("id"))),
  );
  refresh();
}

export async function removerFonte(dados: FormData) {
  await exigirSessao();
  verificar(await db().from("fontes").delete().eq("id", String(dados.get("id"))));
  refresh();
}
