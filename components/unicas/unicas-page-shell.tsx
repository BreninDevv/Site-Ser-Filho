"use client";

import { UnicasGaleria, type UnicasGaleriaItem } from "@/components/unicas/unicas-galeria";
import { UnicasInscricaoForm } from "@/components/unicas/unicas-inscricao-form";
import { UnicasPetals } from "@/components/unicas/unicas-petals";

const DESCRICAO =
  "Um espaço cuidadosamente construído para mulheres que buscam conexão autêntica, " +
  "crescimento interior e celebração da feminilidade em todas as suas formas. " +
  "Venha fazer parte desta jornada de descoberta e renovação.";

/**
 * Página Únicas (Next.js).
 * Gate de acesso fica no Server Component `app/(public)/unicas/page.tsx`
 * (perfil.sexo feminino/mulher ou role Dev → senão /acesso-negado).
 */
export function UnicasPageShell({
  galeria = [],
}: {
  galeria?: UnicasGaleriaItem[];
}) {
  return (
    <section
      className="event-page unicas"
      role="main"
      aria-label="Página do evento Únicas"
    >
      <div
        className="unicas-bg-texture"
        data-repeat-text="ÚNICAS"
        aria-hidden="true"
      />

      <UnicasPetals />

      {galeria.length > 0 ? (
        <div className="unicas-galeria-shell">
          <UnicasGaleria itens={galeria} />
        </div>
      ) : null}

      <div className="unicas-shell container">
        <div className="unicas-card card">
          <div className="unicas-card-header text-center">
            <h1 className="unicas-title">
              <span className="rosa-glyph" aria-hidden="true">
                ❀
              </span>
              Bem Aventuradas
              <span className="rosa-glyph" aria-hidden="true">
                ❀
              </span>
            </h1>
            <p className="unicas-subtitle subtitle">
              Um evento exclusivo para celebrar a jornada feminina
            </p>
          </div>

          <div className="unicas-divider divider" aria-hidden="true">
            <span className="diamond" />
          </div>

          <p className="unicas-description description">{DESCRICAO}</p>

          <div className="unicas-divider divider" aria-hidden="true">
            <span className="diamond" />
          </div>

          <UnicasInscricaoForm />
        </div>
      </div>
    </section>
  );
}
