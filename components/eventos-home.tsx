"use client";

/**
 * Eventos — cover flow 3D (cápsulas), entrada staggered, float e paralaxe.
 */
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import "./events-featured.css";

export type EventoHome = {
  id: string;
  nome: string;
  descricao: string;
  data: string;
  imagem: string;
  exigeInscricao: boolean;
};

function lerGeometria() {
  const w = window.innerWidth;
  if (w < 768) return { radius: 120, rotate: 15, mobileHide: true };
  if (w < 1024) return { radius: 200, rotate: 20, mobileHide: false };
  return { radius: 300, rotate: 25, mobileHide: false };
}

function rotuloCta(exigeInscricao: boolean) {
  return exigeInscricao ? "Fazer inscrição" : "Ver evento";
}

export function EventosHome({
  itens,
  suporte = "O que está acontecendo agora no Ser Filho.",
  tituloComo = "h2",
  mostrarVerTodos = true,
}: {
  itens: EventoHome[];
  suporte?: string;
  tituloComo?: "h1" | "h2";
  mostrarVerTodos?: boolean;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const activeIdxRef = useRef(0);
  const enteredRef = useRef(false);
  const parallaxRef = useRef({ rx: 0, ry: 0 });
  const rafRef = useRef<number | null>(null);
  const [activeIdx, setActiveIdx] = useState(() =>
    Math.max(0, Math.floor(itens.length / 2))
  );
  const [expandidoId, setExpandidoId] = useState<string | null>(null);

  const total = itens.length;
  const expandido = itens.find((e) => e.id === expandidoId) ?? null;
  const ativo = itens[activeIdx] ?? itens[0];

  const updateEventsCarousel = useCallback(() => {
    const items = itemRefs.current.filter(Boolean) as HTMLLIElement[];
    if (items.length === 0) return;

    const { radius, rotate, mobileHide } = lerGeometria();
    const current = activeIdxRef.current;
    const { rx: pxRx, ry: pxRy } = parallaxRef.current;

    items.forEach((item, idx) => {
      const offset = idx - current;
      const rotateY = offset * rotate + (offset === 0 ? pxRy : 0);
      const rotateX = offset === 0 ? pxRx : 0;
      const translateX = offset * radius;
      const translateZ = offset === 0 ? 140 : -Math.abs(offset) * 100;
      const scale =
        offset === 0 ? 1 : Math.max(0.64, 1 - Math.abs(offset) * 0.14);
      const opacity = Math.max(0.45, 1 - Math.abs(offset) * 0.18);
      const zIndex = Math.round(100 - Math.abs(offset));

      item.style.transform = `
        translate(-50%, -50%)
        translateX(${translateX}px)
        translateZ(${translateZ}px)
        rotateY(${rotateY}deg)
        rotateX(${rotateX}deg)
        scale(${scale})
      `;
      item.style.opacity = String(enteredRef.current ? opacity : 0);
      item.style.zIndex = String(zIndex);

      const media = item.querySelector<HTMLElement>(".event-card__media");
      if (media) {
        if (offset === 0) {
          media.style.setProperty("filter", "none", "important");
          media.style.transform = "none";
        } else {
          /* ~5% — blur bem leve */
          media.style.setProperty(
            "filter",
            "blur(1.5px) saturate(0.92)",
            "important"
          );
          media.style.transform = "scale(1.04)";
        }
      }

      item.classList.toggle("is-center", offset === 0);
      item.classList.toggle("is-left", offset < 0);
      item.classList.toggle("is-right", offset > 0);
      item.classList.toggle(
        "is-hidden-mobile",
        mobileHide && Math.abs(offset) > 1
      );
    });
  }, []);

  const swapEvents = useCallback(
    (dir: "left" | "right") => {
      if (total < 1 || expandidoId) return;
      const next =
        dir === "left"
          ? (activeIdxRef.current - 1 + total) % total
          : (activeIdxRef.current + 1) % total;
      activeIdxRef.current = next;
      setActiveIdx(next);
      parallaxRef.current = { rx: 0, ry: 0 };
      updateEventsCarousel();
    },
    [total, updateEventsCarousel, expandidoId]
  );

  const abrirReel = useCallback((evento: EventoHome) => {
    setExpandidoId(evento.id);
  }, []);

  const fecharReel = useCallback(() => {
    setExpandidoId(null);
  }, []);

  useEffect(() => {
    if (total === 0) return;
    const center = Math.floor(total / 2);
    activeIdxRef.current = center;
    setActiveIdx(center);
    updateEventsCarousel();
  }, [total, updateEventsCarousel]);

  useEffect(() => {
    const onResize = () => updateEventsCarousel();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [updateEventsCarousel]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || total === 0) return;

    const items = itemRefs.current.filter(Boolean) as HTMLLIElement[];
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduzir) {
      enteredRef.current = true;
      items.forEach((item) => item.classList.add("revealed"));
      updateEventsCarousel();
      return;
    }

    const timers: number[] = [];
    const observer = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada?.isIntersecting) return;
        enteredRef.current = true;
        items.forEach((item, i) => {
          const t = window.setTimeout(() => {
            item.classList.add("revealed");
            updateEventsCarousel();
          }, i * 120);
          timers.push(t);
        });
        observer.disconnect();
      },
      { threshold: 0.2, rootMargin: "0px 0px -6% 0px" }
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [total, updateEventsCarousel]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || expandidoId) return;

    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isTouch || reduzir) return;

    let target = { rx: 0, ry: 0 };

    const tick = () => {
      const cur = parallaxRef.current;
      const nextRx = cur.rx + (target.rx - cur.rx) * 0.18;
      const nextRy = cur.ry + (target.ry - cur.ry) * 0.18;
      parallaxRef.current = { rx: nextRx, ry: nextRy };
      updateEventsCarousel();
      const done =
        Math.abs(target.rx - nextRx) < 0.01 &&
        Math.abs(target.ry - nextRy) < 0.01;
      if (!done || target.rx !== 0 || target.ry !== 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    const pedir = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      const alvo = e.target as HTMLElement | null;
      if (alvo?.closest(".event-card .btn, .events-reel, .btn-prev, .btn-next")) {
        target = { rx: 0, ry: 0 };
        pedir();
        return;
      }
      const rect = section.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const relX = (e.clientX - rect.left) / rect.width;
      const relY = (e.clientY - rect.top) / rect.height;
      target = {
        rx: (relY - 0.5) * 2,
        ry: (relX - 0.5) * 2,
      };
      pedir();
    };

    const onLeave = () => {
      target = { rx: 0, ry: 0 };
      pedir();
    };

    section.addEventListener("pointermove", onMove);
    section.addEventListener("pointerleave", onLeave);
    return () => {
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [updateEventsCarousel, expandidoId]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && expandidoId) {
        e.preventDefault();
        fecharReel();
        return;
      }
      const dentro =
        section === document.activeElement ||
        section.contains(document.activeElement);
      if (!dentro || expandidoId) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        swapEvents("left");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        swapEvents("right");
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [swapEvents, expandidoId, fecharReel]);

  useEffect(() => {
    const list = listRef.current;
    if (!list || total < 2 || expandidoId) return;

    let startX = 0;
    const onStart = (e: TouchEvent) => {
      startX = e.changedTouches[0]?.clientX ?? 0;
    };
    const onEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0]?.clientX ?? 0;
      const dx = endX - startX;
      if (Math.abs(dx) < 40) return;
      swapEvents(dx > 0 ? "left" : "right");
    };

    list.addEventListener("touchstart", onStart, { passive: true });
    list.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      list.removeEventListener("touchstart", onStart);
      list.removeEventListener("touchend", onEnd);
    };
  }, [swapEvents, total, expandidoId]);

  useEffect(() => {
    if (!expandidoId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [expandidoId]);

  if (total === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="events"
      tabIndex={0}
      aria-roledescription="carrossel"
      aria-label="Próximos eventos"
    >
      <div className="events__ambiance" aria-hidden>
        {itens.map((evento, index) => (
          <div
            key={`bg-${evento.id}`}
            className={
              index === activeIdx
                ? "events__ambiance-layer is-active"
                : "events__ambiance-layer"
            }
            style={{ backgroundImage: `url(${evento.imagem})` }}
          />
        ))}
      </div>

      <div className="events__inner">
        <div className="events__header">
          <div>
            <p className="events__eyebrow">Agenda</p>
            {tituloComo === "h1" ? (
              <h1 className="events__title">Eventos</h1>
            ) : (
              <h2 className="events__title">Eventos</h2>
            )}
          </div>
          <p className="events__support">{suporte}</p>
        </div>

        <div className="events__stage">
          <button
            type="button"
            className="btn-prev"
            aria-label="Evento anterior"
            onClick={() => swapEvents("left")}
            disabled={total < 2 || Boolean(expandidoId)}
          >
            ←
          </button>

          <ul
            ref={listRef}
            className="events__list"
            role="list"
            aria-label="Próximos eventos"
            aria-live="polite"
          >
            {itens.map((evento, index) => (
              <li
                key={evento.id}
                role="listitem"
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                aria-hidden={index !== activeIdx}
              >
                <div className="event-card__float">
                  <article className="event-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="event-card__media"
                      src={evento.imagem}
                      alt={evento.nome}
                      draggable={false}
                    />
                    <div className="event-card__scrim" aria-hidden />
                    <div className="content">
                      <h3>{evento.nome}</h3>
                      {evento.data ? (
                        <p className="date">{evento.data}</p>
                      ) : null}
                      {evento.descricao ? (
                        <p className="desc">{evento.descricao}</p>
                      ) : (
                        <p className="desc" aria-hidden>
                          &nbsp;
                        </p>
                      )}
                    </div>
                  </article>
                </div>
              </li>
            ))}
          </ul>

          {ativo && !expandidoId ? (
            <div className="events__active-ui">
              <button
                type="button"
                className="btn"
                onClick={() => abrirReel(ativo)}
              >
                {rotuloCta(ativo.exigeInscricao)}
              </button>
            </div>
          ) : null}

          <button
            type="button"
            className="btn-next"
            aria-label="Próximo evento"
            onClick={() => swapEvents("right")}
            disabled={total < 2 || Boolean(expandidoId)}
          >
            →
          </button>
        </div>

        {mostrarVerTodos ? (
          <div className="events__footer">
            <Link href="/eventos">Ver todos os eventos</Link>
          </div>
        ) : null}
      </div>

      {expandido ? (
        <div
          className="events-reel"
          role="dialog"
          aria-modal="true"
          aria-label={expandido.nome}
        >
          <button
            type="button"
            className="events-reel__backdrop"
            aria-label="Fechar"
            onClick={fecharReel}
          />
          <div className="events-reel__stage">
            <div className="events-reel__card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="events-reel__media"
                src={expandido.imagem}
                alt={expandido.nome}
              />
              <div className="events-reel__panel">
                <h3>{expandido.nome}</h3>
                {expandido.data ? <p className="date">{expandido.data}</p> : null}
                {expandido.descricao ? (
                  <p className="desc">{expandido.descricao}</p>
                ) : null}
                <Link
                  className="btn"
                  href={
                    expandido.exigeInscricao
                      ? `/eventos/${expandido.id}#inscricao`
                      : `/eventos/${expandido.id}`
                  }
                >
                  {rotuloCta(expandido.exigeInscricao)}
                </Link>
              </div>
            </div>
            <button
              type="button"
              className="events-reel__close"
              aria-label="Fechar"
              onClick={fecharReel}
            >
              ✕
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
