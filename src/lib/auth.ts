import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { variavelDeAmbiente } from "./erros";

// Login com senha única. O cookie guarda "validade.assinatura": sem o SESSAO_SEGREDO
// ninguém consegue fabricar um cookie válido.

export const COOKIE_SESSAO = "minerador_sessao";
export const DURACAO_SESSAO_SEGUNDOS = 60 * 60 * 24 * 30; // 30 dias

function assinar(texto: string): string {
  return createHmac("sha256", variavelDeAmbiente("SESSAO_SEGREDO")).update(texto).digest("hex");
}

function iguais(a: string, b: string): boolean {
  // Compara pelo hash para ter o mesmo tamanho e tempo constante (evita ataque de tempo).
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function senhaCorreta(senha: string): boolean {
  return iguais(senha, variavelDeAmbiente("APP_SENHA"));
}

export function criarValorSessao(): string {
  const validade = String(Date.now() + DURACAO_SESSAO_SEGUNDOS * 1000);
  return `${validade}.${assinar(validade)}`;
}

export function sessaoValida(valor: string | undefined): boolean {
  if (!valor) return false;
  const [validade, assinatura] = valor.split(".");
  if (!validade || !assinatura) return false;
  if (!iguais(assinatura, assinar(validade))) return false;
  return Number(validade) > Date.now();
}

// Usar no início de toda Server Action: elas podem ser chamadas direto, sem passar pelo proxy.
export async function exigirSessao(): Promise<void> {
  const valor = (await cookies()).get(COOKIE_SESSAO)?.value;
  if (!sessaoValida(valor)) redirect("/login");
}
