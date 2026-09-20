"use client";

/**
 * Testemunhos — accordion de cápsulas com entrada staggered, float, zoom e paralaxe.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";

import { INSTAGRAM_SER_FILHO } from "@/lib/midia";
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

function PreviaMedia({ card }: { card: TestemunhoHome }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ehArquivoVideo =
    card.video || /\.(mp4|webm)(\?|#|$)/i.test(card.previa || "");

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !ehArquivoVideo) return;
    el.defaultMuted = true;
    el.muted = true;
    el.playsInline = true;
    const tentar = () => {
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };
    tentar();
    el.addEventListener("loadeddata", tentar);
    el.addEventListener("canplay", tentar);
    return () => {
      el.removeEventListener("loadeddata", tentar);
      el.removeEventListener("canplay", tentar);
    };
  }, [ehArquivoVideo, card.previa]);

  if (ehArquivoVideo && card.previa) {
    return (
      <video
        ref={videoRef}
        className="accordion__media"
        src={card.previa}
        muted
        loop
        playsInline
        autoPlay
        preload="auto"
        {...{ "webkit-playsinline": "true" }}
      />
    );
  }

  if (card.previa) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className="accordion__media"
        src={card.previa}
        alt=""
        draggable={false}
      />
    );
  }

  return <span className="accordion__media accordion__media--empty" />;
}

export function TestemunhosHome({ itens }: { itens: TestemunhoHome[] }) {
  const lista = useMemo(
    () => itens.filter((item) => Boolean(item.destino)),
    [itens]
  );
  const stageRef = useRef<HTMLUListElement>(null);
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: 0.5, y: 0.5, inside: false });

  /** 1. Entrada staggered via IntersectionObserver + classe .revealed */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const cards = Array.from(
      stage.querySelectorAll<HTMLElement>(".accordion > li")
    );
    if (cards.length === 0) return;

    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduzir) {
      cards.forEach((card) => {
        card.classList.add("revealed");
        card.classList.remove("revealing");
      });
      return;
    }

    const timers: number[] = [];

    const observer = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada?.isIntersecting) return;
        cards.forEach((card, i) => {
          const t = window.setTimeout(() => {
            card.classList.add("revealing", "revealed");
            const settle = window.setTimeout(() => {
              card.classList.remove("revealing");
            }, 800);
            timers.push(settle);
          }, i * 120);
          timers.push(t);
        });
        observer.disconnect();
      },
      { threshold: 0.22, rootMargin: "0px 0px -6% 0px" }
    );

    observer.observe(stage);
    return () => {
      observer.disconnect();
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [lista.length]);

  /** 5. Paralaxe leve (só pointer fino / desktop) */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (coarse || reduzir) return;

    const aplicar = () => {
      rafRef.current = null;
      const { x, y, inside } = pointerRef.current;
      const cards = cardRefs.current.filter(Boolean) as HTMLLIElement[];
      cards.forEach((card) => {
        if (!card.classList.contains("revealed")) {
          card.style.removeProperty("--rx");
          card.style.removeProperty("--ry");
          return;
        }
        if (!inside) {
          card.style.setProperty("--rx", "0deg");
          card.style.setProperty("--ry", "0deg");
          return;
        }
        const ry = (x - 0.5) * 4; // −2deg … 2deg
        const rx = (0.5 - y) * 2; // −1deg … 1deg
        card.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
        card.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      });
    };

    const pedirFrame = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(aplicar);
    };

    const onMove = (e: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      pointerRef.current = {
        inside: true,
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
      pedirFrame();
    };

    const onLeave = () => {
      pointerRef.current.inside = false;
      pedirFrame();
    };

    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    return () => {
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [lista.length]);

  const focarCard = useCallback((indice: number) => {
    const el = cardRefs.current[indice];
    const link = el?.querySelector("a");
    link?.focus();
  }, []);

  const anterior = useCallback(() => {
    const atual = cardRefs.current.findIndex(
      (el) => el?.matches(":hover, :focus-within")
    );
    const i = atual <= 0 ? lista.length - 1 : atual - 1;
    focarCard(i);
  }, [focarCard, lista.length]);

  const proximo = useCallback(() => {
    const atual = cardRefs.current.findIndex(
      (el) => el?.matches(":hover, :focus-within")
    );
    const i = atual < 0 || atual >= lista.length - 1 ? 0 : atual + 1;
    focarCard(i);
  }, [focarCard, lista.length]);

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

              <ul
                ref={stageRef}
                className="accordion"
                aria-label="Testemunhos"
              >
                {lista.map((card, index) => (
                  <li
                    key={`${card.destino}-${index}`}
                    ref={(el) => {
                      cardRefs.current[index] = el;
                    }}
                  >
                    <div className="accordion__float">
                      <a
                        href={card.destino}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="accordion__hit"
                        aria-label={`Abrir testemunho: ${nomeCurto(card.nome)}`}
                      >
                        <PreviaMedia card={card} />
                        <div className="content">
                          <span>
                            <h2>{nomeCurto(card.nome)}</h2>
                            <p>Testemunho</p>
                          </span>
                        </div>
                      </a>
                    </div>
                  </li>
                ))}
              </ul>

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
