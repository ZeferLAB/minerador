import { connection } from "next/server";
import { Suspense } from "react";
import { Carregando, Cartao, Titulo } from "@/components/ui";
import { db } from "@/lib/supabase";

// Diagnóstico da configuração: mostra quais variáveis existem (nunca os valores),
// para qual projeto Supabase o site aponta e se as tabelas estão criadas.
// Útil quando aparece "Não foi possível carregar esta página".
export default function Diagnostico() {
  return (
    <>
      <Titulo>Diagnóstico</Titulo>
      <Suspense fallback={<Carregando />}>
        <Verificacoes />
      </Suspense>
    </>
  );
}

const VARIAVEIS = [
  "GEMINI_API_KEY",
  "YOUTUBE_API_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "APP_SENHA",
  "SESSAO_SEGREDO",
  "CRON_SECRET",
];

const TABELAS = ["nichos", "fontes", "rodadas", "comentarios", "necessidades", "clusters", "cluster_necessidades", "oportunidades"];

type Item = { ok: boolean; texto: string };

function tipoDaChaveSupabase(chave: string): Item {
  if (chave.startsWith("sb_secret_")) return { ok: true, texto: "chave secret (correta)" };
  if (chave.startsWith("sb_publishable_")) return { ok: false, texto: "chave publishable: troque pela secret (sb_secret_...)" };
  const partes = chave.split(".");
  if (partes.length === 3) {
    try {
      const role = JSON.parse(Buffer.from(partes[1], "base64url").toString()).role;
      return role === "service_role"
        ? { ok: true, texto: "chave legada service_role (correta)" }
        : { ok: false, texto: `chave legada com papel "${role}": use a service_role ou a secret` };
    } catch {}
  }
  return { ok: false, texto: "formato de chave não reconhecido" };
}

async function Verificacoes() {
  await connection(); // roda só quando alguém abre a página (nunca durante o build)
  const itens: Item[] = [];

  for (const nome of VARIAVEIS) {
    const valor = process.env[nome];
    itens.push({ ok: !!valor, texto: `${nome}: ${valor ? "configurada" : "FALTANDO"}` });
  }

  const url = process.env.SUPABASE_URL ?? "";
  if (url) {
    try {
      const u = new URL(url);
      const semCaminho = u.pathname === "/" || u.pathname === "";
      itens.push({
        ok: semCaminho,
        texto: `Projeto Supabase: ${u.host}${semCaminho ? "" : ` (tem "${u.pathname}" sobrando no final: deixe só https://${u.host})`}`,
      });
    } catch {
      itens.push({ ok: false, texto: "SUPABASE_URL não é um endereço válido" });
    }
  }

  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (chave) {
    const tipo = tipoDaChaveSupabase(chave);
    itens.push({ ok: tipo.ok, texto: `Chave do Supabase: ${tipo.texto}` });
  }

  if (url && chave) {
    for (const tabela of TABELAS) {
      try {
        const { error } = await db().from(tabela).select("*", { count: "exact", head: true });
        itens.push({
          ok: !error,
          texto: `Tabela ${tabela}: ${error ? `ERRO (${error.message || error.code || "não existe ou sem acesso"})` : "ok"}`,
        });
      } catch (erro) {
        itens.push({ ok: false, texto: `Tabela ${tabela}: ERRO (${erro instanceof Error ? erro.message : String(erro)})` });
      }
    }
  }

  return (
    <Cartao>
      <ul className="space-y-1.5 text-sm">
        {itens.map((item, i) => (
          <li key={i} className={item.ok ? "" : "font-medium text-red-600"}>
            {item.ok ? "✓" : "✗"} {item.texto}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-zinc-500">
        Mudou alguma variável na Vercel? Ela só passa a valer depois de um novo deploy (Deployments → ⋯ → Redeploy).
      </p>
    </Cartao>
  );
}
