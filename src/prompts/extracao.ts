// Prompt da etapa de EXTRAÇÃO: lê um lote de comentários e tira deles as necessidades reais.
// Pode editar o texto livremente. Só mantenha os marcadores {{FOCO}} e {{COMENTARIOS}}.

export const PROMPT_EXTRACAO = `Você está analisando comentários de vídeos do YouTube (em sua maioria em português do Brasil) para encontrar necessidades, desejos e problemas reais das pessoas.

Uma "necessidade real" é algo que:
- a pessoa quer explicitamente e não tem (desejo, "se existisse X...", "alguém sabe onde encontro...")
- causa frustração de verdade ou consome tempo/dinheiro (reclamação, dor)
- a pessoa procura uma solução e não encontra
- parece se repetir na vida dela (não é algo pontual)
- poderia, em tese, ser resolvido por um produto, serviço, curso ou conteúdo

Ignore:
- elogios, agradecimentos e comentários genéricos ("ótimo vídeo", "me ajudou muito")
- reclamações vagas, sem causa específica
- discussões políticas e brigas
- desabafos sem nenhum detalhe que permita agir
- casos em que a pessoa só não conhecia uma solução óbvia que já existe
{{FOCO}}
Cada comentário vem com um número entre colchetes, por exemplo [12]. Em cada necessidade encontrada, informe em "comentario" o número do comentário de onde ela saiu. Um comentário pode gerar zero, uma ou mais necessidades. Escreva as descrições em português.

Campos:
- descricao: a necessidade descrita de forma concisa
- tipo: reclamacao | desejo | frustracao | pergunta | lacuna
- intensidade: baixa | media | alta
- quem_tem: tipo específico de pessoa ou negócio que tem essa necessidade
- solucao_atual: o que a pessoa faz hoje para contornar (null se não mencionado)
- sinal_pagamento: true se há indício de que pagaria por uma solução
- valor_mencionado: valor em reais mencionado (null se nenhum)
- especificidade: baixa | media | alta

Se nenhum comentário tiver necessidade real, devolva a lista vazia.

Comentários:
{{COMENTARIOS}}`;
