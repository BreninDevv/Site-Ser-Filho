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
  const [activeIdx, setActiveIdx] = useState(0);

  const total = itens.length;

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
      const scale =
        offset === 0
          ? 1.05
          : Math.max(0.6, 1 - Math.abs(offset) * 0.15);
      const opacity = Math.max(0.3, 1 - Math.abs(offset) * 0.25);
      const zIndex = Math.round(10 - Math.abs(offset));

      item.style.transform = `
        translate(-50%, -50%)
        translateX(${translateX}px)
        rotateY(${rotateY}deg)
        rotateX(${rotateX}deg)
        scale(${scale})
      `;
      item.style.opacity = String(
        enteredRef.current ? opacity : 0
      );
      item.style.zIndex = String(zIndex);

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
      if (total < 1) return;
      const next =
        dir === "left"
          ? (activeIdxRef.current - 1 + total) % total
          : (activeIdxRef.current + 1) % total;
      activeIdxRef.current = next;
      setActiveIdx(next);
      parallaxRef.current = { rx: 0, ry: 0 };
      updateEventsCarousel();
    },
    [total, updateEventsCarousel]
  );

  /* Índice inicial = centro */
  useEffect(() => {
    if (total === 0) return;
    const center = Math.floor(total / 2);
    activeIdxRef.current = center;
    setActiveIdx(center);
    updateEventsCarousel();
  }, [total, updateEventsCarousel]);

  /* Resize */
  useEffect(() => {
    const onResize = () => updateEventsCarousel();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [updateEventsCarousel]);

  /* IntersectionObserver — entrada staggered */
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

  /* Paralaxe desktop (sem GSAP — rAF + overwrite suave) */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

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
  }, [updateEventsCarousel]);

  /* Teclado */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const onKey = (e: KeyboardEvent) => {
      const dentro =
        section === document.activeElement ||
        section.contains(document.activeElement);
      if (!dentro) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        swapEvents("left");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        swapEvents("right");
      }
    };

    section.addEventListener("keydown", onKey);
    return () => section.removeEventListener("keydown", onKey);
  }, [swapEvents]);

  /* Touch swipe no mobile */
  useEffect(() => {
    const list = listRef.current;
    if (!list || total < 2) return;

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
  }, [swapEvents, total]);

  if (total === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="events"
      tabIndex={0}
      aria-roledescription="carrossel"
      aria-label="Próximos eventos"
    >
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
            disabled={total < 2}
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
                      ) : null}
                      <Link
                        className="btn"
                        href={`/eventos/${evento.id}`}
                        tabIndex={index === activeIdx ? 0 : -1}
                      >
                        {evento.exigeInscricao ? "Inscrever-se" : "Ver evento"}
                      </Link>
                    </div>
                  </article>
                </div>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="btn-next"
            aria-label="Próximo evento"
            onClick={() => swapEvents("right")}
            disabled={total < 2}
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
    </section>
  );
}
