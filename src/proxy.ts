import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO, sessaoValida } from "./lib/auth";

// Roda antes de toda requisição: quem não está logado vai para /login.
export function proxy(request: NextRequest) {
  if (sessaoValida(request.cookies.get(COOKIE_SESSAO)?.value)) {
    return NextResponse.next();
  }
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  // Tudo, exceto: login, rota do cron (protegida pelo CRON_SECRET) e arquivos estáticos.
  matcher: ["/((?!login|api/cron|_next/static|_next/image|favicon.ico).*)"],
};
