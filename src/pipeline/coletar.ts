import "server-only";
import { comentariosDoVideo, videosRecentesDoCanal, type Video } from "@/fontes/youtube";
import { ErroAmigavel } from "@/lib/erros";
import { db, verificar } from "@/lib/supabase";
import type { Fonte, Rodada } from "@/lib/tipos";
import { somarTotais, type ResultadoEtapa } from "./comum";

// Etapa 1: busca comentários novos de todas as fontes ativas do nicho.
// Comentários que já estão no banco são ignorados, então rodar de novo não duplica nada.
export async function coletar(rodada: Rodada, prazo: number): Promise<ResultadoEtapa> {
  const fontes = verificar(
    await db().from("fontes").select("*").eq("nicho_id", rodada.nicho_id).eq("ativo", true),
  ) as Fonte[];
  if (fontes.length === 0) {
    throw new ErroAmigavel("Este nicho não tem nenhuma fonte ativa. Cadastre canais ou vídeos em Configurações.");
  }

  let videos = 0;
  let novos = 0;

  for (const fonte of fontes) {
    const lista: Video[] =
      fonte.tipo === "canal"
        ? await videosRecentesDoCanal(fonte.identificador)
        : [{ id: fonte.identificador, titulo: fonte.titulo }];

    for (const video of lista) {
      if (Date.now() > prazo) {
        await somarTotais(rodada, { videos, comentariosNovos: novos });
        return { concluiu: false };
      }
      const comentarios = await comentariosDoVideo(video.id);
      videos++;
      if (comentarios.length === 0) continue;

      const inseridos = verificar(
        await db()
          .from("comentarios")
          .upsert(
            comentarios.map((c) => ({
              nicho_id: rodada.nicho_id,
              fonte_id: fonte.id,
              origem: "youtube",
              id_externo: c.idExterno,
              video_id: video.id,
              video_titulo: video.titulo,
              autor: c.autor,
              texto: c.texto,
              curtidas: c.curtidas,
              publicado_em: c.publicadoEm,
              url: c.url,
            })),
            { onConflict: "nicho_id,origem,id_externo", ignoreDuplicates: true },
          )
          .select("id"),
      );
      novos += inseridos?.length ?? 0;
    }
  }

  await somarTotais(rodada, { videos, comentariosNovos: novos });
  return { concluiu: true };
}
