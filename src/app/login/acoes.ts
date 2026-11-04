"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { EstadoAcao } from "@/components/FormAcao";
import { COOKIE_SESSAO, DURACAO_SESSAO_SEGUNDOS, criarValorSessao, senhaCorreta } from "@/lib/auth";

export async function entrar(_estado: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  if (!senhaCorreta(String(dados.get("senha") ?? ""))) {
    return { erro: "Senha incorreta." };
  }
  (await cookies()).set(COOKIE_SESSAO, criarValorSessao(), {
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
