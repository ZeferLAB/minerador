# Guia: como fazer mudanças com o Claude Code

O projeto foi preparado para você mudar o que quiser **pedindo ao Claude Code**, sem precisar programar. O arquivo `CLAUDE.md` explica o projeto para o Claude, então ele já começa sabendo como tudo funciona.

## O fluxo seguro (sempre este)

1. **Abra a pasta do projeto** no terminal e rode `claude`.
2. **Peça para criar uma branch** (uma cópia de trabalho separada):
   > "Crie uma branch chamada ajuste-prompt para esta mudança."
3. **Descreva a mudança** em linguagem normal (exemplos abaixo). Uma mudança por vez.
4. **Teste no seu computador**: `npm run dev` e abra http://localhost:3000.
5. **Publique a branch**:
   > "Faça o commit e o push desta branch."
   A Vercel gera um **link de preview**. Ele aparece no painel da Vercel e no GitHub. Teste por lá.
6. **Ficou bom?** Junte na `main`:
   > "Faça o merge desta branch na main e o push."
   O site principal é atualizado em 1 ou 2 minutos.

## Exemplos de pedidos

**Ajustar a IA (o que mais compensa)**
- "No prompt de extração, ignore comentários que só falam de preço do curso."
- "Mude o prompt de pontuação para considerar que o público são advogados autônomos com orçamento baixo."
- "Quero que a pontuação use o modelo Pro do Gemini." (Antes, ative a cobrança no AI Studio.)

**Ajustar volume e ritmo**
- "Aumente para 20 vídeos por canal e 200 comentários por vídeo."
- "Agrupe só as necessidades dos últimos 30 dias."
- "Avalie os 15 maiores grupos em vez de 10."

**Telas**
- "Na tela da oportunidade, mostre a data de cada comentário em destaque."
- "Adicione um botão para exportar o relatório da rodada em CSV."
- "Mude a cor das notas altas para azul."

**Novas fontes de dados**
- "Adicione o Reclame Aqui como nova fonte, seguindo o padrão de `src/fontes/youtube.ts`. Comece me explicando as opções antes de programar."
- "Quero importar comentários de um arquivo CSV como fonte."

**Entender o projeto**
- "Me explique em linguagem simples como funciona a etapa de agrupamento."
- "Por que esta rodada deu erro? A mensagem foi: (cole a mensagem)."

## Se algo quebrar

- **O site parou depois de uma mudança:** no painel da Vercel, abra **Deployments**, escolha o último deploy que funcionava, clique em **⋯ > Promote** (ou *Instant Rollback*). O site volta na hora. Depois, peça ao Claude Code para investigar.
- **Erro na tela ou no terminal:** copie a mensagem inteira e cole no Claude Code com "deu este erro: ...".
- **Mudança no banco:** quando o Claude criar um arquivo novo em `supabase/migrations/`, você precisa rodar esse SQL no Supabase (SQL Editor > colar > Run) **antes** de publicar.

## Nunca faça

- ❌ Colar chaves ou senhas no chat do Claude Code, no código ou no GitHub. Elas só vivem no `.env.local` e na Vercel.
- ❌ Dar push direto na `main` sem testar.
- ❌ Apagar ou editar arquivos antigos de `supabase/migrations/`.
- ❌ Aceitar uma mudança se o Claude disser que o `npm run build` falhou. Peça para ele corrigir primeiro.

## Dicas

- Quanto mais específico o pedido, melhor o resultado. "Melhore o site" é ruim; "Na lista de oportunidades, mostre também o público-alvo" é bom.
- Se a mudança for grande, peça primeiro um **plano**: "Antes de mexer, me explique o que você vai mudar."
- Os prompts ficam em `src/prompts/` e são só texto. Dá até para editar direto, sem o Claude Code.
