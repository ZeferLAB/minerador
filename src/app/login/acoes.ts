"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { EstadoAcao } from "@/components/FormAcao";
import { COOKIE_SESSAO, DURACAO_SESSAO_SEGUNDOS, criarValorSessao, senhaCorreta } from "@/lib/auth";
import { mensagemDeErro } from "@/lib/erros";

export async function entrar(_estado: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  let valorSessao: string;
  try {
    if (!senhaCorreta(String(dados.get("senha") ?? ""))) {
      return { erro: "Senha incorreta." };
    }
    valorSessao = criarValorSessao();
  } catch (erro) {
    // Ex.: APP_SENHA ou SESSAO_SEGREDO não cadastradas na Vercel.
    return { erro: mensagemDeErro(erro) };
  }
  (await cookies()).set(COOKIE_SESSAO, valorSessao, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACAO_SESSAO_SEGUNDOS,
  });
  redirect("/");
}

export async function sair() {
  (await cookies()).delete(COOKIE_SESSAO);
  redirect("/login");
}
