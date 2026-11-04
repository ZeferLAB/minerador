@AGENTS.md

# Minerador de Oportunidades

Site privado (uso pessoal) que lê comentários de vídeos do YouTube de um nicho, usa o Gemini para extrair dores e desejos reais, agrupa as dores repetidas e dá uma nota de 1 a 10 para cada grupo como oportunidade de negócio.

O dono do projeto **não é programador** e faz mudanças pedindo ao Claude Code. Explique o que vai fazer em linguagem simples, faça mudanças pequenas e sempre confirme que o build passa.

## Stack
- **Next.js 16** (App Router, TypeScript) com **Cache Components** ligado. Leia `AGENTS.md`: esta versão é diferente do que você conhece. `middleware.ts` agora se chama `src/proxy.ts`.
- **Tailwind CSS 4** para o visual.
- **Supabase** (Postgres) como banco, acessado só no servidor com a service role key.
- **Gemini API** (`@google/genai`) com saída JSON estruturada (schema Zod → `responseJsonSchema`).
- **YouTube Data API v3** via `fetch`.
- **Vercel** (plano Hobby) para hospedagem e cron diário.

## Mapa das pastas
```
src/config/modelos.ts     nomes dos modelos Gemini por etapa
src/config/parametros.ts  números ajustáveis (lotes, limites, tempo)
src/prompts/              textos dos prompts (um arquivo por etapa)
src/fontes/youtube.ts     tudo que fala com o YouTube (cada nova fonte = um arquivo aqui)
src/pipeline/             as 4 etapas + executar.ts (máquina de etapas)
src/lib/gemini.ts         única porta de saída para o Gemini (ritmo, retry, erros)
src/lib/supabase.ts       conexão com o banco + verificar()
src/lib/auth.ts           login por senha única (cookie assinado)
src/lib/tipos.ts          tipos das tabelas
src/proxy.ts              bloqueia tudo sem login (exceto /login e /api/cron)
src/app/                  telas, Server Actions (acoes.ts) e rotas de API
supabase/migrations/      SQL do banco, arquivos numerados
```

## Como o pipeline funciona
Cada rodada passa por `coletando → extraindo → agrupando → pontuando → concluida` (coluna `rodadas.status`).
- A Vercel corta qualquer execução em 5 minutos. Por isso `executarRodada()` trabalha até `PARAMETROS.orcamentoPorExecucaoMs`, salva o progresso e para. A próxima chamada continua de onde parou.
- Toda etapa precisa ser **retomável**: comentários têm `processado`, oportunidades são puladas se já existem, o agrupamento apaga os clusters da rodada antes de recriar.
- Em erro, a mensagem vai para `rodadas.erro` e a rodada continua na mesma etapa.
- `rodadas.bloqueada_ate` impede duas execuções simultâneas da mesma rodada.
- A tela `/rodadas/[id]` chama `POST /api/rodadas/[id]/continuar` em loop (`ContinuarRodada.tsx`). O cron `GET /api/cron/diario` (agenda em `vercel.json`) continua rodadas pendentes e cria uma nova a cada `PARAMETROS.diasEntreRodadas`.
- A IA nunca conta nada: ela devolve números de referência (`[12]`) e o código liga e conta (`cluster_necessidades`).

## Regras
1. **Nunca** coloque chaves ou senhas no código. Elas ficam no `.env.local` (local) e nas Environment Variables da Vercel. Variável nova: adicione também no `.env.example`.
2. Mudou o banco? Crie um arquivo **novo** em `supabase/migrations/` (ex.: `0002_descricao.sql`) e atualize `src/lib/tipos.ts`. Nunca edite migrações já aplicadas. Avise o usuário que ele precisa rodar o SQL no Supabase (SQL Editor).
3. Toda Server Action começa com `await exigirSessao()`. Toda rota em `/api` (exceto o cron) confere a sessão.
4. Componentes que leem o banco ficam dentro de `<Suspense>` e começam com `await connection()` (exigência do Cache Components; sem isso o build falha).
5. Chamadas ao Gemini só por `gerarJson()` em `src/lib/gemini.ts`.
6. Textos de tela e mensagens de erro em **português**. Use `ErroAmigavel` para erros que o usuário vai ler.
7. Mantenha simples: nada de bibliotecas novas sem necessidade clara, nada de abstrações "para o futuro".
8. Antes de terminar qualquer mudança, rode `npm run build` e `npm run lint`. Os dois precisam passar.

## Comandos
- `npm run dev` roda local em http://localhost:3000 (precisa do `.env.local`).
- `npm run build` compila (use para conferir se nada quebrou).
- `npm run lint` checa o código.
