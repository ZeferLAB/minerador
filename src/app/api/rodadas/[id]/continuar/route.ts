import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO, sessaoValida } from "@/lib/auth";
import { executarRodada } from "@/pipeline/executar";

// Avança uma rodada pelo tempo que couber (~3 min). A tela da rodada chama esta rota
// repetidamente até a rodada terminar.
export const maxDuration = 300;

export async function POST(request: NextRequest, ctx: RouteContext<"/api/rodadas/[id]/continuar">) {
  if (!sessaoValida(request.cookies.get(COOKIE_SESSAO)?.value)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }
  const { id } = await ctx.params;
  const resultado = await executarRodada(id);

  if (resultado.situacao === "ocupada") return NextResponse.json({ situacao: "ocupada" });
  return NextResponse.json({
    situacao: resultado.situacao,
    status: resultado.rodada.status,
    erro: resultado.rodada.erro,
  });
}
