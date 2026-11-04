import { PARAMETROS } from "@/config/parametros";
import type { TotaisRodada } from "@/lib/tipos";

// Painel recolhível "Como ter melhores resultados".
// Com "totais", também mostra alertas sobre a rodada específica (pouco volume, poucas dores etc.).

function alertasDaRodada(t: TotaisRodada): string[] {
  const alertas: string[] = [];
  const comentarios = t.comentariosProcessados ?? 0;
  const necessidades = t.necessidadesNovas ?? 0;

  if (comentarios < 300) {
    alertas.push(
      `Só ${comentarios} comentários foram analisados. Para enxergar padrões, o ideal são centenas: adicione mais canais ou aumente "videosPorCanal".`,
    );
  }
  if (comentarios >= 50 && necessidades / comentarios < 0.1) {
    alertas.push(
      "Poucos comentários viraram necessidades. Os canais provavelmente atraem elogios e conversa, não dúvidas e reclamações. Prefira canais cujo público é quem tem o problema.",
    );
  }
  if ((t.grupos ?? 0) > 0 && (t.oportunidades ?? 0) === 0) {
    alertas.push(
      `Nenhuma dor se repetiu ${PARAMETROS.minimoMencoesParaNota} vezes ou mais, então nada recebeu nota. Os grupos aparecem em "Outros grupos". Aumente o volume de comentários.`,
    );
  }
  return alertas;
}

export function DicasResultados({ totais, abertoPorPadrao = false }: { totais?: TotaisRodada; abertoPorPadrao?: boolean }) {
  const alertas = totais ? alertasDaRodada(totais) : [];

  return (
    <details
      open={abertoPorPadrao || alertas.length > 0}
      className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/40"
    >
      <summary className="cursor-pointer font-semibold text-amber-900 dark:text-amber-200">
        💡 Como ter melhores resultados nas rodadas
      </summary>

      {alertas.length > 0 && (
        <div className="mt-3 rounded border border-amber-300 bg-white p-3 dark:border-amber-800 dark:bg-zinc-900">
          <p className="mb-1 font-medium">Nesta rodada:</p>
          <ul className="list-disc space-y-1 pl-5">
            {alertas.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3 space-y-3 text-zinc-700 dark:text-zinc-300">
        <div>
          <p className="font-medium">1. Escolha canais pelo público, não pelo tema</p>
          <p>
            O que importa é <b>quem comenta</b>. Um canal sobre investimentos atrai investidores, mesmo falando de contabilidade.
            Busque canais cujo público <b>é quem tem a dor</b> que você quer resolver: se quer ajudar MEIs, canais que ensinam MEI;
            se quer vender para contadores, canais sobre rotina de escritório contábil.
          </p>
        </div>
        <div>
          <p className="font-medium">2. Prefira vídeos que geram dúvidas e reclamações</p>
          <p>
            Tutoriais, &quot;como resolver X&quot;, mudanças de lei, problemas comuns e &quot;erros que todo mundo comete&quot; geram
            comentários com perguntas e desabafos. Entrevistas, vlogs e conteúdo motivacional geram elogios, que a IA descarta.
          </p>
        </div>
        <div>
          <p className="font-medium">3. Volume: quanto mais comentários, melhor</p>
          <p>
            Use de <b>4 a 6 canais</b> por nicho, com bastante comentário. Uma rodada boa analisa <b>centenas</b> de comentários.
            Também dá para adicionar <b>vídeos específicos</b> muito comentados (cole o link do vídeo em Configurações).
          </p>
        </div>
        <div>
          <p className="font-medium">4. Use o campo &quot;Foco&quot; do nicho</p>
          <p>
            Diga à IA o que procurar. Exemplo: <i>&quot;dores de donos de pequenas empresas com impostos e burocracia&quot;</i>. Isso
            reduz o ruído e deixa os grupos mais úteis.
          </p>
        </div>
        <div>
          <p className="font-medium">5. Um nicho por público</p>
          <p>
            Não misture públicos diferentes no mesmo nicho (ex.: contadores e empresários). As dores se misturam e os grupos ficam
            pequenos. Crie um nicho para cada um.
          </p>
        </div>
        <div>
          <p className="font-medium">6. Como ler as notas</p>
          <p>
            Só recebem nota as dores mencionadas <b>{PARAMETROS.minimoMencoesParaNota} vezes ou mais</b>. Nota baixa não é defeito:
            a IA é cética de propósito. Valorize as oportunidades com <b>muitas menções</b> e com gente dizendo que <b>pagaria</b>.
            E sempre leia os comentários originais antes de decidir.
          </p>
        </div>
        <div>
          <p className="font-medium">7. Dê tempo ao sistema</p>
          <p>
            Cada rodada soma as dores dos últimos {PARAMETROS.janelaDias} dias. Com rodadas semanais, as dores que se repetem vão
            ganhando peso, e o relatório melhora a cada semana.
          </p>
        </div>
      </div>
    </details>
  );
}
