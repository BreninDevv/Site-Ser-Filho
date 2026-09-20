"use client";

/**
 * Seção Testemunhos: carrossel 3D em cápsula (fundo escuro).
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
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

function estiloDoOffset(
  offset: number,
  arrastePx: number,
  mobile: boolean
): CSSProperties {
  const passo = mobile ? 64 : 92;
  const x = offset * passo + arrastePx * 0.35;
  const abs = Math.abs(offset);
  const centro = abs === 0;

  const scale = centro ? 1.06 : Math.max(0.55, 0.92 - abs * 0.14);
  const opacity = centro ? 1 : Math.max(0.35, 0.85 - abs * 0.2);
  const rotateY = centro ? 0 : offset > 0 ? -22 - abs * 6 : 22 + abs * 6;
  const rotateZ = centro ? 0 : offset > 0 ? 2.5 : -2.5;
  const z = centro ? 90 : -abs * 70;
  const y = centro ? 0 : abs * 6;

  return {
    ["--tx" as string]: `${x}px`,
    ["--ty" as string]: `${y}px`,
    ["--tz" as string]: `${z}px`,
    ["--ry" as string]: `${rotateY}deg`,
    ["--rz" as string]: `${rotateZ}deg`,
    ["--sc" as string]: String(scale),
    opacity,
    zIndex: 100 - abs,
    filter: abs > 1 ? `blur(${Math.min(2.2, (abs - 1) * 1.1)}px)` : "none",
  };
}

function nomeCurto(nome: string) {
  if (nome.length <= 22) return nome;
  return `${nome.slice(0, 20).trim()}…`;
}

export function TestemunhosHome({ itens }: { itens: TestemunhoHome[] }) {
  const lista = useMemo(() => itens.slice(0, 6), [itens]);
  const [ativo, setAtivo] = useState(0);
  const [arrastePx, setArrastePx] = useState(0);
  const [arrastando, setArrastando] = useState(false);
  const [mobile, setMobile] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; ativo: boolean }>({ x: 0, ativo: false });

  useEffect(() => {
    const mqMobile = window.matchMedia("(max-width: 720px)");
    const sync = () => setMobile(mqMobile.matches);
    sync();
    mqMobile.addEventListener("change", sync);
    return () => mqMobile.removeEventListener("change", sync);
  }, []);

  const irPara = useCallback(
    (indice: number) => {
      if (lista.length === 0) return;
      const proximo = ((indice % lista.length) + lista.length) % lista.length;
      if (proximo === ativo) return;
      setAtivo(proximo);
    },
    [ativo, lista.length]
  );

  const anterior = useCallback(() => irPara(ativo - 1), [ativo, irPara]);
  const proximo = useCallback(() => irPara(ativo + 1), [ativo, irPara]);

  function aoPointerDown(evento: ReactPointerEvent<HTMLDivElement>) {
    if (lista.length < 2) return;
    dragRef.current = { x: evento.clientX, ativo: true };
    setArrastando(true);
    stageRef.current?.setPointerCapture(evento.pointerId);
  }

  function aoPointerMove(evento: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current.ativo) return;
    setArrastePx(evento.clientX - dragRef.current.x);
  }

  function finalizarArraste(evento: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current.ativo) return;
    const delta = evento.clientX - dragRef.current.x;
    dragRef.current.ativo = false;
    setArrastando(false);
    setArrastePx(0);
    const limiar = mobile ? 40 : 56;
    if (delta > limiar) anterior();
    else if (delta < -limiar) proximo();
  }

  function abrirDestino(destino: string) {
    window.open(destino, "_blank", "noopener,noreferrer");
  }

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
                ref={stageRef}
                className={`testemunhos-carousel__stage${arrastando ? " is-dragging" : ""}`}
                onPointerDown={aoPointerDown}
                onPointerMove={aoPointerMove}
                onPointerUp={finalizarArraste}
                onPointerCancel={finalizarArraste}
              >
                {lista.map((card, index) => {
                  let offset = index - ativo;
                  if (lista.length > 2) {
                    if (offset > lista.length / 2) offset -= lista.length;
                    if (offset < -lista.length / 2) offset += lista.length;
                  }
                  const ativoCard = index === ativo;
                  const estilo = estiloDoOffset(
                    offset,
                    arrastando ? arrastePx : 0,
                    mobile
                  );

                  return (
                    <div
                      key={card.nome + card.destino + index}
                      role="button"
                      tabIndex={0}
                      className={`testemunhos-carousel__card${ativoCard ? " is-active" : ""}`}
                      style={estilo}
                      aria-pressed={ativoCard}
                      aria-label={`Ver testemunho: ${nomeCurto(card.nome)}`}
                      onClick={() => {
                        if (ativoCard) abrirDestino(card.destino);
                        else irPara(index);
                      }}
                      onKeyDown={(evento) => {
                        if (evento.key === "Enter" || evento.key === " ") {
                          evento.preventDefault();
                          if (ativoCard) abrirDestino(card.destino);
                          else irPara(index);
                        }
                      }}
                    >
                      <div className="testemunhos-carousel__card-inner">
                        {card.video && card.previa ? (
                          <video
                            src={card.previa}
                            muted
                            loop
                            playsInline
                            autoPlay={ativoCard}
                            preload="metadata"
                          />
                        ) : card.previa ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={card.previa} alt="" draggable={false} />
                        ) : null}
                        <span
                          className="testemunhos-carousel__card-fade"
                          aria-hidden
                        />
                        <span className="testemunhos-carousel__card-meta">
                          <strong>{nomeCurto(card.nome)}</strong>
                          <span>Testemunho</span>
                        </span>
                      </div>
                    </div>
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
