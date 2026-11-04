// Erro com mensagem pronta para mostrar na tela (em português, sem detalhes técnicos).
export class ErroAmigavel extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroAmigavel";
  }
}

export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof ErroAmigavel) return erro.message;
  if (erro instanceof Error) return `Erro inesperado: ${erro.message}`;
  return "Erro inesperado.";
}

export function variavelDeAmbiente(nome: string): string {
  const valor = process.env[nome];
  if (!valor) {
    throw new ErroAmigavel(
      `A variável de ambiente ${nome} não está configurada. Veja o arquivo .env.example.`,
    );
  }
  return valor;
}
