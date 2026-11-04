// Números que controlam o comportamento do sistema.
// Pode alterar à vontade: nada aqui quebra o código, só muda volume, custo e tempo.

export const PARAMETROS = {
  // Coleta (YouTube)
  videosPorCanal: 10, // quantos vídeos recentes de cada canal
  comentariosPorVideo: 100, // máximo de comentários lidos por vídeo
  tamanhoMinimoComentario: 40, // comentários menores que isso são ignorados ("top", "primeiro!")

  // Extração (IA)
  comentariosPorLote: 30, // quantos comentários vão juntos em cada chamada à IA

  // Agrupamento (IA)
  janelaDias: 60, // agrupa as necessidades encontradas nos últimos N dias
  maxNecessidadesNoAgrupamento: 1500, // limite de segurança para não estourar a IA

  // Pontuação (IA)
  gruposParaPontuar: 10, // quantos dos maiores grupos viram oportunidade com nota
  exemplosPorGrupo: 8, // quantos comentários de exemplo a IA lê para dar a nota

  // Ritmo e tempo
  intervaloEntreChamadasIaMs: 6500, // espera entre chamadas (nível gratuito do Gemini: ~10 por minuto)
  orcamentoPorExecucaoMs: 200_000, // para de trabalhar após ~3min20s (a Vercel corta em 5min)

  // Automação
  diasEntreRodadas: 7, // o cron diário cria uma rodada nova a cada N dias
};
