# Minerador de Oportunidades

Lê comentários de vídeos do YouTube de um nicho, encontra com IA (Gemini) as dores e desejos reais das pessoas, agrupa as dores repetidas e dá uma nota de 1 a 10 para cada uma como oportunidade de negócio. Cada nota vem com link para os comentários originais.

> Para fazer mudanças no projeto, leia o [GUIA-MUDANCAS.md](GUIA-MUDANCAS.md).

---

## 1. Contas e chaves (uma vez só)

Você vai precisar de 5 contas, todas gratuitas. Guarde cada chave num lugar seguro (um gerenciador de senhas, por exemplo). **Nunca** cole chaves em chats, e-mails ou no código.

### 1.1 GitHub
Crie uma conta em https://github.com. É lá que fica o código.

### 1.2 Supabase (banco de dados)
1. Crie uma conta em https://supabase.com e um **New project**. Região: *South America (São Paulo)*.
2. Abra **SQL Editor > New query**, cole o conteúdo inteiro de [`supabase/migrations/0001_inicial.sql`](supabase/migrations/0001_inicial.sql) e clique em **Run**.
3. Em **Project Settings > API**, copie:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** (secret) → `SUPABASE_SERVICE_ROLE_KEY`. Esta chave dá acesso total ao banco: trate como senha.

### 1.3 Gemini (IA)
1. Acesse https://aistudio.google.com/apikey com sua conta Google.
2. **Create API key** → `GEMINI_API_KEY`.

A assinatura do app Gemini **não** inclui a API, mas o nível gratuito da API cobre este projeto (modelos Flash).

### 1.4 YouTube Data API
1. Acesse https://console.cloud.google.com e crie um projeto (pode usar o mesmo do Gemini).
2. **APIs & Services > Library**: procure **YouTube Data API v3** e clique em **Enable**.
3. **APIs & Services > Credentials > Create credentials > API key** → `YOUTUBE_API_KEY`.
4. Recomendado: em **Edit API key**, restrinja a chave à "YouTube Data API v3".

### 1.5 Senhas do próprio site
Invente três valores:
- `APP_SENHA`: a senha que você vai digitar para entrar no site.
- `SESSAO_SEGREDO`: um texto aleatório e longo (mínimo 32 caracteres).
- `CRON_SECRET`: outro texto aleatório.

Para gerar textos aleatórios, rode no terminal:
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 2. Rodar no seu computador

Precisa do [Node.js](https://nodejs.org) (versão 20 ou mais nova).

1. Copie o arquivo `.env.example` para `.env.local` e preencha com as chaves acima.
2. No terminal, dentro da pasta do projeto:
   ```
   npm install
   npm run dev
   ```
3. Abra http://localhost:3000 e entre com a `APP_SENHA`.

---

## 3. Publicar na Vercel

1. Crie uma conta em https://vercel.com usando o login do GitHub.
2. **Add New > Project**, escolha o repositório `minerador-oportunidades` e clique em **Import**.
3. Antes do Deploy, abra **Environment Variables** e cadastre as 7 variáveis do `.env.example`, com os mesmos valores do seu `.env.local`.
4. Clique em **Deploy**.

A partir daí, todo `git push` na branch `main` publica sozinho. Pushes em outras branches geram um **link de teste (preview)** sem mexer no site principal.

O **cron** (rodada automática) é configurado sozinho pelo arquivo `vercel.json`. Ele roda todo dia às 8h (horário de Brasília): continua rodadas pendentes e cria uma nova por nicho a cada 7 dias.

---

## 4. Como usar

1. **Configurações**: crie um nicho (ex.: "Advocacia trabalhista"). O campo **foco** é opcional e serve para direcionar a IA.
2. No mesmo nicho, cole links de **canais** (`youtube.com/@nome`) ou **vídeos** com bastante comentário. Canais de concorrentes e de referências do nicho funcionam melhor.
3. **Painel > Rodar agora**: abre a tela da rodada, que vai avançando sozinha. Deixe a página aberta. A primeira rodada leva de 5 a 15 minutos.
4. Clique numa oportunidade para ver a avaliação completa e os **comentários originais**, com link.

> **Lembrete:** a nota é uma **triagem**, não uma validação. Antes de investir, leia os comentários, converse com pelo menos 5 pessoas que têm a dor, pesquise concorrentes e teste a demanda (landing page, por exemplo).

---

## 5. Custos

Uso normal: **R$ 0/mês**. Tudo roda nos planos gratuitos:

| Serviço | Limite gratuito | Uso por rodada |
|---|---|---|
| YouTube | 10.000 unidades/dia | cerca de 100 |
| Gemini Flash | limite diário de requisições (muda com o tempo; veja no AI Studio) | cerca de 15 a 30 |
| Supabase | 500 MB | poucos MB |
| Vercel Hobby | uso pessoal | poucos minutos |

O Supabase gratuito pausa projetos parados por cerca de 1 semana. Como o cron roda todo dia, o projeto fica ativo.

---

## 6. Problemas comuns

| Mensagem | O que fazer |
|---|---|
| "A variável de ambiente X não está configurada" | Falta a variável no `.env.local` (local) ou na Vercel (Settings > Environment Variables). Depois de mudar na Vercel, faça **Redeploy**. |
| "Limite diário do Gemini atingido" | Normal no nível gratuito. A rodada continua no dia seguinte pelo cron, ou clique em "Tentar de novo" depois. |
| "Modelo do Gemini não encontrado" | O Google mudou os nomes. Ajuste `src/config/modelos.ts` (lista em https://ai.google.dev/gemini-api/docs/models). |
| "Cota diária do YouTube esgotada" | Espere o dia seguinte ou reduza `videosPorCanal` em `src/config/parametros.ts`. |
| "Não foi possível carregar esta página" | Veja o erro em Vercel > projeto > **Logs**. Normalmente é o Supabase pausado (reative no painel) ou uma variável faltando. |
