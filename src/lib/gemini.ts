import "server-only";
import { ApiError, GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { MODELOS } from "@/config/modelos";
import { PARAMETROS } from "@/config/parametros";
import { ErroAmigavel, variavelDeAmbiente } from "./erros";

// Todas as chamadas ao Gemini passam por aqui. Este módulo:
// - espera entre chamadas para respeitar o limite por minuto do nível gratuito;
// - pede a resposta em JSON no formato exato do schema (saída estruturada);
// - tenta de novo em erros temporários;
// - transforma erros técnicos em mensagens em português.

let cliente: GoogleGenAI | null = null;
let ultimaChamada = 0;

function gemini(): GoogleGenAI {
  if (!cliente) cliente = new GoogleGenAI({ apiKey: variavelDeAmbiente("GEMINI_API_KEY") });
  return cliente;
}

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

async function respeitarRitmo() {
  const falta = ultimaChamada + PARAMETROS.intervaloEntreChamadasIaMs - Date.now();
  if (falta > 0) await esperar(falta);
  ultimaChamada = Date.now();
}

function traduzirErro(erro: ApiError): ErroAmigavel {
  if (erro.status === 429) {
    const diario = /per ?day|daily/i.test(erro.message);
    return new ErroAmigavel(
      diario
        ? "Limite diário do Gemini atingido. A rodada continua amanhã automaticamente (ou clique em \"Tentar de novo\" depois)."
        : "Limite por minuto do Gemini atingido. Aguarde um pouco e clique em \"Tentar de novo\".",
    );
  }
  if (erro.status === 400 || erro.status === 403) {
    return new ErroAmigavel(
      `O Gemini recusou a chamada (verifique a GEMINI_API_KEY e os nomes em src/config/modelos.ts): ${erro.message}`,
    );
  }
  if (erro.status === 404) {
    return new ErroAmigavel(
      `Modelo do Gemini não encontrado. Confira os nomes em src/config/modelos.ts: ${erro.message}`,
    );
  }
  return new ErroAmigavel(`O Gemini está instável (erro ${erro.status}). Tente de novo em alguns minutos.`);
}

export async function gerarJson<T>(modelo: string, prompt: string, schema: z.ZodType<T>): Promise<T> {
  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
  delete jsonSchema.$schema; // o Gemini não precisa (e pode recusar) este campo

  let modeloAtual = modelo;
  for (let tentativa = 1; ; tentativa++) {
    await respeitarRitmo();
    try {
      const resposta = await gemini().models.generateContent({
        model: modeloAtual,
        contents: prompt,
        config: { responseMimeType: "application/json", responseJsonSchema: jsonSchema },
      });
      return schema.parse(JSON.parse(resposta.text ?? ""));
    } catch (erro) {
      const temporario =
        (erro instanceof ApiError && (erro.status === 429 || erro.status >= 500)) ||
        erro instanceof SyntaxError || // JSON cortado ou inválido
        erro instanceof z.ZodError; // JSON fora do formato esperado
      const limiteDiario = erro instanceof ApiError && erro.status === 429 && /per ?day|daily/i.test(erro.message);

      if (temporario && !limiteDiario && tentativa < 3) {
        // Modelo sobrecarregado: na próxima tentativa usa o modelo reserva em vez de só esperar.
        if (erro instanceof ApiError && erro.status === 503 && modeloAtual !== MODELOS.reserva) {
          modeloAtual = MODELOS.reserva;
          continue;
        }
        await esperar(tentativa * 15_000);
        continue;
      }
      if (erro instanceof ApiError) throw traduzirErro(erro);
      if (erro instanceof SyntaxError || erro instanceof z.ZodError) {
        throw new ErroAmigavel("A IA devolveu uma resposta em formato inválido 3 vezes seguidas. Tente de novo.");
      }
      throw erro;
    }
  }
}
