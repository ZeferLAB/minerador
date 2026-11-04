"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { estiloBotao } from "./ui";

// Enquanto a tela da rodada estiver aberta, chama /continuar até a rodada terminar,
// atualizando a página a cada passo. Se houver erro, mostra o botão "Tentar de novo".

type Resposta = { situacao: "concluida" | "pendente" | "erro" | "ocupada"; erro?: string | null };

export function ContinuarRodada({ rodadaId, comErro }: { rodadaId: string; comErro: boolean }) {
  const router = useRouter();
  const [ativo, setAtivo] = useState(!comErro);
  const [aviso, setAviso] = useState<string | null>(null);
  const [concluida, setConcluida] = useState(false);

  useEffect(() => {
    if (!ativo) return;
    let cancelado = false;

    async function ciclo() {
      while (!cancelado) {
        let resposta: Resposta;
        try {
          const r = await fetch(`/api/rodadas/${rodadaId}/continuar`, { method: "POST" });
          resposta = r.ok ? await r.json() : { situacao: "erro", erro: `Erro ${r.status} no servidor.` };
        } catch {
          resposta = { situacao: "erro", erro: "Sem conexão com o servidor." };
        }
        if (cancelado) return;
        router.refresh();

        if (resposta.situacao === "concluida") {
          setConcluida(true);
          return setAtivo(false);
        }
        if (resposta.situacao === "erro") {
          setAviso(resposta.erro ?? null);
          return setAtivo(false);
        }
        if (resposta.situacao === "ocupada") {
          setAviso("Esta rodada já está sendo processada em outro lugar. Aguardando…");
          await new Promise((r) => setTimeout(r, 20_000));
        } else {
          setAviso(null);
        }
      }
    }
    ciclo();
    return () => {
      cancelado = true;
    };
  }, [ativo, rodadaId, router]);

  if (concluida) return null;
  if (ativo) {
    return (
      <p className="flex items-center gap-2 text-sm text-sky-700 dark:text-sky-400">
        <span className="h-2 w-2 animate-pulse rounded-full bg-sky-500" />
        Processando… pode deixar esta página aberta. {aviso}
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {aviso && <p className="text-sm text-red-600">{aviso}</p>}
      <button className={estiloBotao} onClick={() => { setAviso(null); setAtivo(true); }}>
        Tentar de novo
      </button>
    </div>
  );
}
