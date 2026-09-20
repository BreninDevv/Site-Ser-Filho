"use client";

/**
 * Seção Testemunhos: cápsulas lado a lado; prévia em movimento no ativo.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  embedPreviaAutoplay,
  INSTAGRAM_SER_FILHO,
} from "@/lib/midia";
import { TestemunhosMotion } from "@/components/testemunhos-motion";

import "./testemunhos-featured.css";

export type TestemunhoHome = {
  nome: string;
  descricao: string;
  destino: string;
  previa: string;
  video: boolean;
};

function nomeCurto(nome: string) {
  if (nome.length <= 28) return nome;
  return `${nome.slice(0, 26).trim()}…`;
}

function PreviaMedia({
  card,
  ativo,
}: {
  card: TestemunhoHome;
  ativo: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ehArquivoVideo =
    card.video || /\.(mp4|webm)(\?|#|$)/i.test(card.previa || "");

  // MP4/WebM enviado: sempre prioridade sobre embed do YouTube
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !ehArquivoVideo) return;

    el.defaultMuted = true;
    el.muted = true;
    el.playsInline = true;

    const tentarPlay = () => {
      const promessa = el.play();
      if (promessa && typeof promessa.catch === "function") {
        promessa.catch(() => {});
      }
    };

    tentarPlay();
    el.addEventListener("loadeddata", tentarPlay);
    el.addEventListener("canplay", tentarPlay);
    el.addEventListener("loadedmetadata", tentarPlay);

    return () => {
      el.removeEventListener("loadeddata", tentarPlay);
      el.removeEventListener("canplay", tentarPlay);
      el.removeEventListener("loadedmetadata", tentarPlay);
    };
  }, [ehArquivoVideo, card.previa, ativo]);

  if (ehArquivoVideo && card.previa) {
    return (
      <span className="testemunhos-carousel__media testemunhos-carousel__media--video">
        <video
          ref={videoRef}
          src={card.previa}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          // iOS legado
          {...{ "webkit-playsinline": "true" }}
        />
      </span>
    );
  }

  // Sem arquivo de vídeo: YouTube no card ativo
  const embed = ativo ? embedPreviaAutoplay(card.destino) : null;
  if (embed) {
    return (
      <span className="testemunhos-carousel__media testemunhos-carousel__media--embed">
        <iframe
          key={embed}
          src={embed}
          title=""
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen={false}
          loading="eager"
          tabIndex={-1}
        />
      </span>
    );
  }

  if (card.previa) {
    return (
      <span className="testemunhos-carousel__media testemunhos-carousel__media--image">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={card.previa} alt="" draggable={false} />
      </span>
    );
  }

  return <span className="testemunhos-carousel__card-empty" />;
}

export function TestemunhosHome({ itens }: { itens: TestemunhoHome[] }) {
  const lista = useMemo(
    () => itens.filter((item) => Boolean(item.destino)),
    [itens]
  );
  const [ativo, setAtivo] = useState(0);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (ativo >= lista.length) setAtivo(0);
  }, [ativo, lista.length]);

  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, []);

  const irPara = useCallback(
    (indice: number) => {
      if (lista.length === 0) return;
      setAtivo(((indice % lista.length) + lista.length) % lista.length);
    },
    [lista.length]
  );

  const destacarComSuavidade = useCallback((indice: number) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      setAtivo(indice);
    }, 90);
  }, []);

  const anterior = useCallback(() => irPara(ativo - 1), [ativo, irPara]);
  const proximo = useCallback(() => irPara(ativo + 1), [ativo, irPara]);

  return (
    <div className="testemunhos-carousel-band testemunhos-carousel-band--solo">
      <TestemunhosMotion />
      <div className="testemunhos-carousel-inner">
        <div className="testemunhos-header testemunhos-header--dark">
          <div>
            <p
              className="testemunhos-reveal mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/50"
              data-reveal="label"
            >
              Histórias
            </p>
            <h2
              className="testemunhos-reveal font-heading text-4xl font-bold tracking-tight text-white"
              data-reveal="title"
            >
              Testemunhos
            </h2>
          </div>
          <p
            className="testemunhos-reveal max-w-sm text-sm text-white/60"
            data-reveal="support"
          >
            Histórias reais de pessoas que encontraram algo novo dentro do Ser
            Filho.
          </p>
        </div>

        {lista.length === 0 ? (
          <p className="py-16 text-center text-sm text-white/50">
            Nenhum testemunho publicado ainda.
          </p>
        ) : (
          <>
            <p className="testemunhos-carousel-label">Escolha um testemunho</p>
            <div className="testemunhos-carousel">
              <button
                type="button"
                className="testemunhos-carousel__arrow"
                aria-label="Anterior"
                onClick={anterior}
                disabled={lista.length < 2}
              >
                <svg viewBox="0 0 24 24" aria-hidden>
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <div
                className="testemunhos-carousel__stage"
                role="list"
                aria-label="Testemunhos"
              >
                {lista.map((card, index) => {
                  const ativoCard = index === ativo;
                  return (
                    <a
                      key={`${card.destino}-${index}`}
                      role="listitem"
                      href={card.destino}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`testemunhos-carousel__card${ativoCard ? " is-active" : ""}`}
                      aria-current={ativoCard ? "true" : undefined}
                      aria-label={`Abrir testemunho: ${nomeCurto(card.nome)}`}
                      onMouseEnter={() => destacarComSuavidade(index)}
                      onFocus={() => irPara(index)}
                    >
                      <span className="testemunhos-carousel__card-inner">
                        <PreviaMedia card={card} ativo={ativoCard} />
                        <span
                          className="testemunhos-carousel__card-fade"
                          aria-hidden
                        />
                        <span className="testemunhos-carousel__card-meta">
                          <strong>{nomeCurto(card.nome)}</strong>
                          <span>Testemunho</span>
                        </span>
                      </span>
                    </a>
                  );
                })}
              </div>

              <button
                type="button"
                className="testemunhos-carousel__arrow"
                aria-label="Próximo"
                onClick={proximo}
                disabled={lista.length < 2}
              >
                <svg viewBox="0 0 24 24" aria-hidden>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </>
        )}

        <div
          className="testemunhos-reveal mt-10 text-center"
          data-reveal="cta"
        >
          <a
            href={INSTAGRAM_SER_FILHO}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-white/30 bg-transparent px-6 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Ver mais testemunhos
          </a>
        </div>
      </div>
    </div>
  );
}
