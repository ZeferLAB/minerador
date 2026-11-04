// Modelos do Gemini usados em cada etapa.
// Os nomes "-latest" apontam sempre para a versão mais nova, então não precisam ser trocados
// quando o Google lança um modelo novo. Lista de nomes: https://ai.google.dev/gemini-api/docs/models
//
// O nível gratuito da API só cobre os modelos Flash. Para usar o Pro na pontuação
// (análise mais profunda), ative a cobrança no Google AI Studio e troque para "gemini-pro-latest".

export const MODELOS = {
  extracao: "gemini-flash-latest",
  agrupamento: "gemini-flash-latest",
  pontuacao: "gemini-flash-latest",

  // Usado automaticamente quando o modelo da etapa está sobrecarregado (erro 503 do Google).
  reserva: "gemini-flash-lite-latest",
};
