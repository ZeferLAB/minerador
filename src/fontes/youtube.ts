import "server-only";
import { PARAMETROS } from "@/config/parametros";
import { ErroAmigavel, variavelDeAmbiente } from "@/lib/erros";

// Tudo o que fala com a YouTube Data API v3.
// Cada consulta usada aqui custa 1 unidade da cota diária (10.000 unidades grátis por dia).

const API = "https://www.googleapis.com/youtube/v3";

type ErroYoutube = { error?: { code: number; message: string; errors?: { reason: string }[] } };

async function chamar<T>(recurso: string, parametros: Record<string, string>): Promise<T> {
  const url = new URL(`${API}/${recurso}`);
  for (const [chave, valor] of Object.entries(parametros)) url.searchParams.set(chave, valor);
  url.searchParams.set("key", variavelDeAmbiente("YOUTUBE_API_KEY"));

  const resposta = await fetch(url, { cache: "no-store" });
  const corpo = (await resposta.json()) as T & ErroYoutube;
  if (resposta.ok) return corpo;

  const motivo = corpo.error?.errors?.[0]?.reason ?? "";
  if (motivo === "quotaExceeded") {
    throw new ErroAmigavel("Cota diária do YouTube esgotada. Ela renova à meia-noite (horário do Pacífico).");
  }
  if (motivo === "commentsDisabled") throw new ComentariosDesativados();
  if (resposta.status === 400 || resposta.status === 403) {
    throw new ErroAmigavel(`O YouTube recusou a chamada (verifique a YOUTUBE_API_KEY): ${corpo.error?.message}`);
  }
  throw new ErroAmigavel(`Erro do YouTube (${resposta.status}): ${corpo.error?.message}`);
}

class ComentariosDesativados extends Error {}

// ---------- Cadastro de fontes ----------

export type FonteResolvida = {
  tipo: "canal" | "video";
  identificador: string;
  titulo: string;
  url: string;
};

// Aceita links como youtube.com/@canal, youtube.com/channel/UC..., youtube.com/watch?v=..., youtu.be/..., /shorts/...
export async function resolverFonte(link: string): Promise<FonteResolvida> {
  let url: URL;
  try {
    url = new URL(link.trim().startsWith("http") ? link.trim() : `https://${link.trim()}`);
  } catch {
    throw new ErroAmigavel("Link inválido. Cole o endereço completo de um canal ou vídeo do YouTube.");
  }
  const host = url.hostname.replace(/^www\.|^m\./, "");
  const partes = url.pathname.split("/").filter(Boolean);

  let videoId: string | null = null;
  if (host === "youtu.be") videoId = partes[0] ?? null;
  else if (host === "youtube.com" && partes[0] === "watch") videoId = url.searchParams.get("v");
  else if (host === "youtube.com" && (partes[0] === "shorts" || partes[0] === "live")) videoId = partes[1] ?? null;

  if (videoId) {
    const dados = await chamar<{ items: { id: string; snippet: { title: string } }[] }>("videos", {
      part: "snippet",
      id: videoId,
    });
    const video = dados.items?.[0];
    if (!video) throw new ErroAmigavel("Vídeo não encontrado.");
    return { tipo: "video", identificador: video.id, titulo: video.snippet.title, url: `https://www.youtube.com/watch?v=${video.id}` };
  }

  let filtro: Record<string, string> | null = null;
  if (host === "youtube.com" && partes[0]?.startsWith("@")) filtro = { forHandle: partes[0] };
  else if (host === "youtube.com" && partes[0] === "channel" && partes[1]) filtro = { id: partes[1] };
  if (!filtro) {
    throw new ErroAmigavel("Não reconheci o link. Use o endereço de um canal (youtube.com/@nome) ou de um vídeo.");
  }

  const dados = await chamar<{ items?: { id: string; snippet: { title: string } }[] }>("channels", {
    part: "snippet",
    ...filtro,
  });
  const canal = dados.items?.[0];
  if (!canal) throw new ErroAmigavel("Canal não encontrado.");
  return { tipo: "canal", identificador: canal.id, titulo: canal.snippet.title, url: `https://www.youtube.com/channel/${canal.id}` };
}

// ---------- Coleta ----------

export type Video = { id: string; titulo: string };

export async function videosRecentesDoCanal(canalId: string): Promise<Video[]> {
  // A playlist de "uploads" de um canal tem o mesmo ID do canal trocando "UC" por "UU".
  const playlistId = canalId.replace(/^UC/, "UU");
  const dados = await chamar<{ items?: { snippet: { title: string; resourceId: { videoId: string } } }[] }>(
    "playlistItems",
    { part: "snippet", playlistId, maxResults: String(PARAMETROS.videosPorCanal) },
  );
  return (dados.items ?? []).map((item) => ({ id: item.snippet.resourceId.videoId, titulo: item.snippet.title }));
}

export async function tituloDoVideo(videoId: string): Promise<string> {
  const dados = await chamar<{ items?: { snippet: { title: string } }[] }>("videos", { part: "snippet", id: videoId });
  return dados.items?.[0]?.snippet.title ?? "";
}

export type ComentarioYoutube = {
  idExterno: string;
  autor: string;
  texto: string;
  curtidas: number;
  publicadoEm: string;
  url: string;
};

type RespostaComentarios = {
  nextPageToken?: string;
  items?: {
    id: string;
    snippet: {
      channelId: string;
      topLevelComment: {
        snippet: {
          authorDisplayName: string;
          authorChannelId?: { value: string };
          textOriginal: string;
          likeCount: number;
          publishedAt: string;
        };
      };
    };
  }[];
};

// Comentários principais mais relevantes de um vídeo, já filtrados.
export async function comentariosDoVideo(videoId: string): Promise<ComentarioYoutube[]> {
  const resultado: ComentarioYoutube[] = [];
  let pagina: string | undefined;
  let paginasLidas = 0;

  try {
    do {
      const dados = await chamar<RespostaComentarios>("commentThreads", {
        part: "snippet",
        videoId,
        order: "relevance",
        textFormat: "plainText",
        maxResults: String(Math.min(100, PARAMETROS.comentariosPorVideo)),
        ...(pagina ? { pageToken: pagina } : {}),
      });
      for (const item of dados.items ?? []) {
        const c = item.snippet.topLevelComment.snippet;
        const doDonoDoCanal = c.authorChannelId?.value === item.snippet.channelId;
        if (doDonoDoCanal || c.textOriginal.trim().length < PARAMETROS.tamanhoMinimoComentario) continue;
        resultado.push({
          idExterno: item.id,
          autor: c.authorDisplayName,
          texto: c.textOriginal.trim().slice(0, 2000),
          curtidas: c.likeCount,
          publicadoEm: c.publishedAt,
          url: `https://www.youtube.com/watch?v=${videoId}&lc=${item.id}`,
        });
      }
      pagina = dados.nextPageToken;
      paginasLidas++;
      // Limite de 3 páginas por vídeo para não gastar cota com vídeos cheios de comentários curtos.
    } while (pagina && resultado.length < PARAMETROS.comentariosPorVideo && paginasLidas < 3);
  } catch (erro) {
    if (erro instanceof ComentariosDesativados) return [];
    throw erro;
  }
  return resultado.slice(0, PARAMETROS.comentariosPorVideo);
}
