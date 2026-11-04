import { connection } from "next/server";
import Link from "next/link";
import { Suspense } from "react";
import { ListaOportunidades } from "@/components/ListaOportunidades";
import { Carregando, Cartao, StatusRodadaBadge, Titulo, estiloBotao, formatarData } from "@/components/ui";
import { oportunidadesDaRodada } from "@/lib/consultas";
import { db, verificar } from "@/lib/supabase";
import type { Nicho, Rodada } from "@/lib/tipos";
import { rodarAgora } from "./rodadas/acoes";

// Painel: um bloco por nicho ativo, com a última rodada e as 5 melhores oportunidades.
// Tudo que lê o banco fica dentro de <Suspense> (exigência do Next.js 16 com Cache Components).
export default function Painel() {
  return (
    <>
      <Titulo>Painel</Titulo>
      <Suspense fallback={<Carregando />}>
        <ConteudoPainel />
      </Suspense>
    </>
  );
}

async function ConteudoPainel() {
  await connection(); // lê o banco só quando alguém abre a página (nunca durante o build)
  const nichos = verificar(await db().from("nichos").select("*").eq("ativo", true).order("nome")) as Nicho[];

  if (nichos.length === 0) {
    return (
      <Cartao>
        <p>
          Nenhum nicho ativo. Comece em{" "}
          <Link href="/configuracoes" className="underline">
            Configurações
          </Link>{" "}
          cadastrando um nicho e os canais do YouTube dele.
        </p>
      </Cartao>
    );
  }

  return (
    <div className="space-y-6">
      {nichos.map((nicho) => (
        <BlocoNicho key={nicho.id} nicho={nicho} />
      ))}
    </div>
  );
}

async function BlocoNicho({ nicho }: { nicho: Nicho }) {
  const rodadas = verificar(
    await db().from("rodadas").select("*").eq("nicho_id", nicho.id).order("iniciada_em", { ascending: false }).limit(10),
  ) as Rodada[];
  const ultima = rodadas[0];
  const ultimaConcluida = rodadas.find((r) => r.status === "concluida");
  const top = ultimaConcluida ? await oportunidadesDaRodada(ultimaConcluida.id, 5) : [];

  return (
    <Cartao>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">{nicho.nome}</h2>
        {ultima && (
          <Link href={`/rodadas/${ultima.id}`} className="flex items-center gap-2 text-sm text-zinc-500 hover:underline">
            <StatusRodadaBadge status={ultima.status} erro={ultima.erro} />
            última rodada: {formatarData(ultima.iniciada_em)}
          </Link>
        )}
        <form action={rodarAgora} className="ml-auto">
          <input type="hidden" name="nicho_id" value={nicho.id} />
          <button className={estiloBotao}>{ultima && ultima.status !== "concluida" ? "Ver rodada em andamento" : "Rodar agora"}</button>
        </form>
      </div>
      {ultimaConcluida ? (
        <>
          <p className="mb-1 text-sm text-zinc-500">
            Melhores oportunidades da rodada de {formatarData(ultimaConcluida.iniciada_em)}:
          </p>
          <ListaOportunidades itens={top} />
          <Link href={`/rodadas/${ultimaConcluida.id}`} className="mt-2 inline-block text-sm underline">
            Ver relatório completo
          </Link>
        </>
      ) : (
        <p className="text-sm text-zinc-500">Nenhuma rodada concluída ainda.</p>
      )}
    </Cartao>
  );
}
