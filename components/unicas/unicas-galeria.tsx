"use client";

import { useState } from "react";

export type UnicasGaleriaItem = {
  id: string;
  titulo: string;
  subtitulo: string;
  url: string;
  video: boolean;
};

export function UnicasGaleria({ itens }: { itens: UnicasGaleriaItem[] }) {
  const lista = itens.slice(0, 12);
  const [ativo, setAtivo] = useState<number | null>(lista.length > 0 ? 0 : null);

  if (lista.length === 0) return null;

  const countClass =
    lista.length === 1
      ? "count-1"
      : lista.length === 2
        ? "count-2"
        : "";

  return (
    <section className="unicas-galeria" aria-label="Galeria Únicas">
      <div className="unicas-galeria-heading">
        <h2>Momentos Únicas</h2>
        <p>Passe o mouse ou toque para ver cada faixa</p>
      </div>

      <ul
        className={[
          "unicas-accordion",
          countClass,
          ativo !== null ? "has-active" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {lista.map((item, index) => {
          const aberto = ativo === index;
          return (
            <li
              key={item.id}
              className={aberto ? "is-active" : undefined}
              onMouseEnter={() => setAtivo(index)}
              onFocus={() => setAtivo(index)}
              onClick={() => setAtivo(index)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setAtivo(index);
                }
              }}
              tabIndex={0}
              role="button"
              aria-expanded={aberto}
              aria-label={item.titulo}
            >
              {item.video ? (
                <video
                  src={item.url}
                  muted
                  loop
                  playsInline
                  autoPlay={aberto}
                  preload="metadata"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt="" />
              )}
              <div className="content">
                <h2>{item.titulo}</h2>
                {item.subtitulo ? <span>{item.subtitulo}</span> : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
