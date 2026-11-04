// Prompt da etapa de PONTUAÇÃO: avalia um grupo de necessidades como oportunidade de negócio.
// Pode editar o texto livremente. Só mantenha os marcadores {{GRUPO}} e {{EXEMPLOS}}.

export const PROMPT_PONTUACAO = `Você está avaliando uma necessidade como oportunidade de negócio no mercado brasileiro.
Seja honesto e cético. A maioria das necessidades NÃO é um bom negócio.

Considere: se a dor é real e frequente, se as pessoas pagariam, o tamanho provável do público no Brasil, soluções que já existem (no Brasil e fora) e por que não bastam, e o quão difícil seria construir e vender.

Grupo de necessidades:
{{GRUPO}}

Comentários originais de exemplo:
{{EXEMPLOS}}

Campos (escreva em português):
- nota: de 1 a 10 (10 = oportunidade excelente; seja rigoroso)
- raciocinio: avaliação honesta de por que é ou não é uma oportunidade
- solucoes_existentes: produtos ou serviços que já resolvem isso
- por_que_falham: por que as soluções existentes não bastam
- direcao_produto: que tipo de produto ou serviço poderia vencer
- preco_estimado: faixa de preço em R$ (ex.: "R$ 29 a R$ 59/mês"), ou null
- canal_primeiros_clientes: onde encontrar os 10 primeiros clientes
- complexidade: baixa | media | alta
- red_flags: motivos pelos quais isso pode não dar certo`;
