"use client";

import { Cartao, estiloBotao } from "@/components/ui";

// Tela mostrada quando uma página falha ao carregar (ex.: banco fora do ar, variável de ambiente faltando).
// Em produção o Next.js esconde o detalhe do erro; ele aparece nos logs da Vercel (Project > Logs).
export default function Erro({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Cartao className="space-y-3">
      <h1 className="text-lg font-semibold">Não foi possível carregar esta página</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Verifique se o Supabase está no ar e se as variáveis de ambiente estão configuradas. O detalhe do erro está nos
        logs da Vercel{error.digest ? ` (código ${error.digest})` : ""}.
      </p>
      {process.env.NODE_ENV === "development" && <pre className="text-xs whitespace-pre-wrap text-red-600">{error.message}</pre>}
      <button className={estiloBotao} onClick={reset}>
        Tentar de novo
      </button>
    </Cartao>
  );
}
