import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ErroAmigavel, variavelDeAmbiente } from "./erros";

let cliente: SupabaseClient | null = null;

// Conexão com o banco. Só roda no servidor: a chave dá acesso total aos dados.
export function db(): SupabaseClient {
  if (!cliente) {
    cliente = createClient(
      variavelDeAmbiente("SUPABASE_URL"),
      variavelDeAmbiente("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false } },
    );
  }
  return cliente;
}

// Lança um erro legível quando uma consulta ao banco falha.
export function verificar<T>(resultado: { data: T; error: { message: string } | null }): T {
  if (resultado.error) {
    throw new ErroAmigavel(`Erro no banco de dados: ${resultado.error.message}`);
  }
  return resultado.data;
}
