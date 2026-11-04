// Formato das linhas de cada tabela do banco (ver supabase/migrations).

export type StatusRodada = "coletando" | "extraindo" | "agrupando" | "pontuando" | "concluida";

export type Nicho = {
  id: string;
  nome: string;
  foco: string | null;
  ativo: boolean;
  criado_em: string;
};

export type Fonte = {
  id: string;
  nicho_id: string;
  tipo: "canal" | "video";
  identificador: string;
  titulo: string;
  url: string;
  ativo: boolean;
};

export type TotaisRodada = {
  videos?: number;
  comentariosNovos?: number;
  comentariosProcessados?: number;
  necessidadesNovas?: number;
  necessidadesAgrupadas?: number;
  grupos?: number;
  oportunidades?: number;
};

export type Rodada = {
  id: string;
  nicho_id: string;
  status: StatusRodada;
  erro: string | null;
  totais: TotaisRodada;
  bloqueada_ate: string | null;
  iniciada_em: string;
  concluida_em: string | null;
};

export type Comentario = {
  id: string;
  nicho_id: string;
  fonte_id: string | null;
  id_externo: string;
  video_id: string | null;
  video_titulo: string | null;
  autor: string | null;
  texto: string;
  curtidas: number;
  publicado_em: string | null;
  url: string;
  processado: boolean;
};

export type Necessidade = {
  id: string;
  nicho_id: string;
  comentario_id: string;
  descricao: string;
  tipo: string;
  intensidade: string;
  quem_tem: string | null;
  solucao_atual: string | null;
  sinal_pagamento: boolean;
  valor_mencionado: number | null;
  especificidade: string;
};

export type Cluster = {
  id: string;
  rodada_id: string;
  necessidade_unificada: string;
  publico_alvo: string | null;
  tipo_dominante: string | null;
  ocorrencias: number;
  qtd_pagaria: number;
};

export type Oportunidade = {
  id: string;
  cluster_id: string;
  nota: number;
  raciocinio: string;
  solucoes_existentes: string[];
  por_que_falham: string | null;
  direcao_produto: string | null;
  preco_estimado: string | null;
  canal_primeiros_clientes: string | null;
  complexidade: string | null;
  red_flags: string[];
  criado_em: string;
};
