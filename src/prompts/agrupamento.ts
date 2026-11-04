// Prompt da etapa de AGRUPAMENTO: junta necessidades iguais descritas com palavras diferentes.
// Pode editar o texto livremente. Só mantenha o marcador {{NECESSIDADES}}.

export const PROMPT_AGRUPAMENTO = `Agrupe as necessidades abaixo em grupos, onde cada grupo é a MESMA necessidade de fundo descrita com palavras diferentes.

Regras:
- Cada necessidade vem com um número entre colchetes, por exemplo [37]. Em "itens", liste os números das necessidades que pertencem ao grupo.
- Cada número deve aparecer em no máximo um grupo.
- Não junte necessidades apenas por serem do mesmo assunto: elas precisam ser essencialmente o mesmo problema ou desejo.
- Necessidades isoladas, sem par, podem ficar em grupos de um item só.
- Escreva em português.

Campos de cada grupo:
- necessidade_unificada: a necessidade em uma frase
- publico_alvo: quem tem essa necessidade
- tipo_dominante: reclamacao | desejo | frustracao | pergunta | lacuna
- itens: números das necessidades do grupo

Necessidades:
{{NECESSIDADES}}`;
