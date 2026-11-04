import { connection } from "next/server";
import { Suspense } from "react";
import { FormAcao } from "@/components/FormAcao";
import { Carregando, Cartao, Titulo, estiloBotao, estiloBotaoSecundario, estiloCampo } from "@/components/ui";
import { db, verificar } from "@/lib/supabase";
import type { Fonte, Nicho } from "@/lib/tipos";
import { adicionarFonte, alternarFonte, criarNicho, excluirNicho, removerFonte, salvarNicho } from "./acoes";

// Configurações: cadastro de nichos e das fontes (canais e vídeos do YouTube) de cada nicho.
export default function Configuracoes() {
  return (
    <>
      <Titulo>Configurações</Titulo>
      <div className="space-y-6">
        <Cartao>
          <h2 className="mb-3 font-semibold">Novo nicho</h2>
          <FormAcao acao={criarNicho} className="space-y-2">
            <input name="nome" placeholder="Nome (ex.: Advocacia trabalhista)" required className={estiloCampo} />
            <textarea
              name="foco"
              rows={2}
              placeholder="Foco opcional para a IA (ex.: dê atenção a dores de advogados com audiências)"
              className={estiloCampo}
            />
            <button className={estiloBotao}>Criar nicho</button>
          </FormAcao>
        </Cartao>
        <Suspense fallback={<Carregando />}>
          <ListaNichos />
        </Suspense>
      </div>
    </>
  );
}

async function ListaNichos() {
  await connection(); // lê o banco só quando alguém abre a página (nunca durante o build)
  const nichos = verificar(await db().from("nichos").select("*").order("criado_em")) as Nicho[];
  const fontes = verificar(await db().from("fontes").select("*").order("criado_em")) as Fonte[];

  return nichos.map((nicho) => (
    <Cartao key={nicho.id} className="space-y-4">
      <FormAcao acao={salvarNicho} className="space-y-2">
        <input type="hidden" name="id" value={nicho.id} />
        <input name="nome" defaultValue={nicho.nome} required className={`${estiloCampo} font-semibold`} />
        <textarea name="foco" rows={2} defaultValue={nicho.foco ?? ""} placeholder="Foco opcional para a IA" className={estiloCampo} />
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="ativo" defaultChecked={nicho.ativo} /> Ativo (entra na rodada automática)
          </label>
          <button className={estiloBotaoSecundario}>Salvar</button>
        </div>
      </FormAcao>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Fontes do YouTube</h3>
        <ul className="mb-3 space-y-1 text-sm">
          {fontes
            .filter((f) => f.nicho_id === nicho.id)
            .map((f) => (
              <li key={f.id} className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-zinc-100 px-1.5 text-xs dark:bg-zinc-800">{f.tipo}</span>
                <a href={f.url} target="_blank" rel="noreferrer" className={f.ativo ? "underline" : "text-zinc-400 line-through"}>
                  {f.titulo}
                </a>
                <form action={alternarFonte}>
                  <input type="hidden" name="id" value={f.id} />
                  <input type="hidden" name="ativo" value={String(f.ativo)} />
                  <button className="text-xs text-zinc-500 hover:underline">{f.ativo ? "desativar" : "ativar"}</button>
                </form>
                <form action={removerFonte}>
                  <input type="hidden" name="id" value={f.id} />
                  <button className="text-xs text-red-600 hover:underline">remover</button>
                </form>
              </li>
            ))}
        </ul>
        <FormAcao acao={adicionarFonte} className="flex flex-wrap gap-2">
          <input type="hidden" name="nicho_id" value={nicho.id} />
          <input
            name="link"
            placeholder="Cole o link de um canal (youtube.com/@nome) ou vídeo"
            required
            className={`${estiloCampo} min-w-0 flex-1`}
          />
          <button className={estiloBotao}>Adicionar</button>
        </FormAcao>
      </div>

      <form action={excluirNicho} className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
        <input type="hidden" name="id" value={nicho.id} />
        <button className="text-xs text-red-600 hover:underline">
          Excluir nicho (apaga também fontes, rodadas e resultados)
        </button>
      </form>
    </Cartao>
  ));
}
