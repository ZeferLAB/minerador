import { FormAcao } from "@/components/FormAcao";
import { Cartao, estiloBotao, estiloCampo } from "@/components/ui";
import { entrar } from "./acoes";

export default function PaginaLogin() {
  return (
    <div className="mx-auto mt-24 w-full max-w-sm">
      <Cartao>
        <h1 className="mb-4 text-lg font-semibold">Minerador de Oportunidades</h1>
        <FormAcao acao={entrar} className="space-y-3">
          <input type="password" name="senha" placeholder="Senha" required autoFocus className={estiloCampo} />
          <button type="submit" className={`${estiloBotao} w-full`}>
            Entrar
          </button>
        </FormAcao>
      </Cartao>
    </div>
  );
}
