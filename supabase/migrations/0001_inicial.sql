-- Estrutura inicial do banco do Minerador de Oportunidades.
-- Como aplicar: Supabase > SQL Editor > colar este arquivo inteiro > Run.

-- Nichos de mercado que serão analisados
create table nichos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  foco text,                       -- instrução extra para a IA (opcional)
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- De onde vêm os comentários (hoje só YouTube: canal ou vídeo)
create table fontes (
  id uuid primary key default gen_random_uuid(),
  nicho_id uuid not null references nichos(id) on delete cascade,
  tipo text not null check (tipo in ('canal', 'video')),
  identificador text not null,     -- ID do canal (UC...) ou do vídeo
  titulo text not null,
  url text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  unique (nicho_id, tipo, identificador)
);

-- Cada execução do pipeline. "status" é a etapa em que a rodada está.
create table rodadas (
  id uuid primary key default gen_random_uuid(),
  nicho_id uuid not null references nichos(id) on delete cascade,
  status text not null default 'coletando'
    check (status in ('coletando', 'extraindo', 'agrupando', 'pontuando', 'concluida')),
  erro text,                       -- preenchido quando a última tentativa falhou
  totais jsonb not null default '{}'::jsonb,
  bloqueada_ate timestamptz,       -- evita duas execuções da mesma rodada ao mesmo tempo
  iniciada_em timestamptz not null default now(),
  concluida_em timestamptz
);
create index rodadas_nicho_idx on rodadas (nicho_id, iniciada_em desc);

-- Comentários coletados. id_externo único evita salvar o mesmo comentário duas vezes.
create table comentarios (
  id uuid primary key default gen_random_uuid(),
  nicho_id uuid not null references nichos(id) on delete cascade,
  fonte_id uuid references fontes(id) on delete set null,
  origem text not null default 'youtube',
  id_externo text not null,
  video_id text,
  video_titulo text,
  autor text,
  texto text not null,
  curtidas integer not null default 0,
  publicado_em timestamptz,
  url text not null,
  processado boolean not null default false,
  coletado_em timestamptz not null default now(),
  unique (nicho_id, origem, id_externo)
);
create index comentarios_pendentes_idx on comentarios (nicho_id) where not processado;

-- Necessidades extraídas pela IA, sempre ligadas ao comentário de origem
create table necessidades (
  id uuid primary key default gen_random_uuid(),
  nicho_id uuid not null references nichos(id) on delete cascade,
  comentario_id uuid not null references comentarios(id) on delete cascade,
  descricao text not null,
  tipo text not null,
  intensidade text not null,
  quem_tem text,
  solucao_atual text,
  sinal_pagamento boolean not null default false,
  valor_mencionado numeric,
  especificidade text not null,
  criado_em timestamptz not null default now()
);
create index necessidades_nicho_idx on necessidades (nicho_id, criado_em desc);

-- Grupos de necessidades iguais (por rodada). Contagens calculadas pelo código.
create table clusters (
  id uuid primary key default gen_random_uuid(),
  rodada_id uuid not null references rodadas(id) on delete cascade,
  necessidade_unificada text not null,
  publico_alvo text,
  tipo_dominante text,
  ocorrencias integer not null,
  qtd_pagaria integer not null default 0
);
create index clusters_rodada_idx on clusters (rodada_id, ocorrencias desc);

-- Ligação exata entre grupo e necessidades (de onde saem os links do relatório)
create table cluster_necessidades (
  cluster_id uuid not null references clusters(id) on delete cascade,
  necessidade_id uuid not null references necessidades(id) on delete cascade,
  primary key (cluster_id, necessidade_id)
);

-- Avaliação de um grupo como oportunidade de negócio
create table oportunidades (
  id uuid primary key default gen_random_uuid(),
  cluster_id uuid not null unique references clusters(id) on delete cascade,
  nota integer not null check (nota between 1 and 10),
  raciocinio text not null,
  solucoes_existentes jsonb not null default '[]'::jsonb,
  por_que_falham text,
  direcao_produto text,
  preco_estimado text,
  canal_primeiros_clientes text,
  complexidade text,
  red_flags jsonb not null default '[]'::jsonb,
  criado_em timestamptz not null default now()
);

-- Segurança: RLS ligado e nenhuma política pública.
-- Só o servidor (com a SERVICE_ROLE_KEY) acessa os dados.
alter table nichos enable row level security;
alter table fontes enable row level security;
alter table rodadas enable row level security;
alter table comentarios enable row level security;
alter table necessidades enable row level security;
alter table clusters enable row level security;
alter table cluster_necessidades enable row level security;
alter table oportunidades enable row level security;
