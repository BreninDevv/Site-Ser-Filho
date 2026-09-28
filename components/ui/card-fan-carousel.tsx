"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";

import "./card-fan-carousel.css";

export interface CardItem {
  imgUrl: string;
  alt?: string;
  linkUrl?: string;
  video?: boolean;
}

interface SocialCardsProps {
  cards: CardItem[];
  /** Controles claros, para fundo azul ou escuro. */
  tone?: "light" | "on-color";
}

const MAX_VISIBLE = 7;
const HALF = 3;

const FAN_POSITIONS = [
  { rot: -21, scale: 0.7756, x: -30, y: 7.3, zIndex: 1 },
  { rot: -14, scale: 0.8498, x: -22, y: 4.0, zIndex: 2 },
  { rot: -7, scale: 0.9346, x: -11, y: 1.3, zIndex: 3 },
  { rot: 0, scale: 1.0, x: 0, y: 0.0, zIndex: 10 },
  { rot: 7, scale: 0.9346, x: 11, y: 1.3, zIndex: 3 },
  { rot: 14, scale: 0.8498, x: 22, y: 4.0, zIndex: 2 },
  { rot: 21, scale: 0.7756, x: 30, y: 7.3, zIndex: 1 },
];

function getResponsiveMultiplier(width: number) {
  if (width < 480) return 0.28;
  if (width < 640) return 0.38;
  if (width < 768) return 0.5;
  if (width < 1024) return 0.75;
  return 1.0;
}

function getHeightMultiplier(width: number) {
  let idealPx: number;
  if (width < 480) idealPx = 24 * 16;
  else if (width < 640) idealPx = 26 * 16;
  else if (width < 768) idealPx = 28 * 16;
  else if (width < 1024) idealPx = 32 * 16;
  else idealPx = 36 * 16;

  const available = window.innerHeight * 0.7;
  if (available >= idealPx) return 1;
  return available / idealPx;
}

function getSlotConfig(totalCards: number, slot: number) {
  if (totalCards >= MAX_VISIBLE) {
    return FAN_POSITIONS[slot] ?? FAN_POSITIONS[HALF];
  }
  const center = (totalCards - 1) / 2;
  const distance = totalCards > 1 ? (slot - center) / Math.max(center, 1) : 0;
  const absDistance = Math.abs(distance);
  const t = totalCards <= 1 ? 0 : (totalCards - 2) / (MAX_VISIBLE - 2);
  return {
    rot: distance * (12 + 9 * t),
    scale: 1 - 0.12 * absDistance * absDistance,
    x: distance * (6 + 24 * t),
    y: absDistance * absDistance * (1.6 + 5.7 * t),
    zIndex: 10 - Math.round(Math.abs(slot - center)),
  };
}

const ARROW_LIGHT =
  "relative flex items-center justify-center rounded-full border-[1.5px] border-black/10 bg-black/5 backdrop-blur-[16px] text-black/40 cursor-pointer shrink-0 z-30 outline-none shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:border-black/25 hover:text-black/70 active:opacity-70 transition-colors duration-300 before:content-[''] before:absolute before:inset-[3px] before:rounded-full before:border before:border-black/[0.04] before:pointer-events-none";

const ARROW_ON_COLOR =
  "relative flex items-center justify-center rounded-full border-[1.5px] border-white/25 bg-white/10 backdrop-blur-[16px] text-white cursor-pointer shrink-0 z-30 outline-none shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:border-white/50 hover:text-white active:opacity-70 transition-colors duration-300 before:content-[''] before:absolute before:inset-[3px] before:rounded-full before:border before:border-white/10 before:pointer-events-none";

function FanMedia({ card, index }: { card: CardItem; index: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ehVideo =
    Boolean(card.video) || /\.(mp4|webm)(\?|#|$)/i.test(card.imgUrl || "");

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !ehVideo) return;
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
  }, [ehVideo, card.imgUrl]);

  if (!card.imgUrl) {
    return (
      <div className="absolute inset-0 z-10 grid place-items-center bg-[#1e4aad] px-3 text-center text-sm font-medium text-white">
        {card.alt || "Testemunho"}
      </div>
    );
  }

  if (ehVideo) {
    return (
      <video
        ref={videoRef}
        className="absolute inset-0 z-10 h-full w-full object-cover"
        src={card.imgUrl}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        {...{ "webkit-playsinline": "true" }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={card.imgUrl}
      loading="lazy"
      alt={card.alt || `Card ${index}`}
      className="absolute inset-0 z-10 h-full w-full object-cover"
    />
  );
}

export default function SocialCards({ cards, tone = "light" }: SocialCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isAnimating = useRef(false);
  const hasEntered = useRef(false);
  const directionRef = useRef<"left" | "right" | null>(null);
  const prevVisible = useRef<Set<number>>(new Set());

  const totalCards = cards.length;
  const needsPagination = totalCards > MAX_VISIBLE;
  const [centerIndex, setCenterIndex] = useState(
    needsPagination ? HALF : totalCards >> 1
  );

  const getVisibleMap = useCallback(
    (center: number) => {
      const map = new Map<number, number>();
      if (!needsPagination) {
        cards.forEach((_, i) => map.set(i, i));
        return map;
      }
      for (let slot = 0; slot < MAX_VISIBLE; slot++) {
        map.set(
          ((center + slot - HALF) % totalCards + totalCards) % totalCards,
          slot
        );
      }
      return map;
    },
    [totalCards, needsPagination, cards]
  );

  const cycle = useCallback(
    (direction: "left" | "right") => {
      if (isAnimating.current || !needsPagination) return;
      isAnimating.current = true;
      directionRef.current = direction;
      setCenterIndex((prev) =>
        direction === "right"
          ? (prev + 1) % totalCards
          : (prev - 1 + totalCards) % totalCards
      );
    },
    [totalCards, needsPagination]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !totalCards) return;

    const cardElements = Array.from(
      container.querySelectorAll<HTMLElement>(".fan-card")
    );
    if (!cardElements.length) return;

    const visibleMap = getVisibleMap(centerIndex);
    const previouslyVisible = prevVisible.current;
    const direction = directionRef.current;
    const isFirstMount = !hasEntered.current;
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const multiplier = getResponsiveMultiplier(window.innerWidth);
    const hMult = getHeightMultiplier(window.innerWidth);
    const slotCount = needsPagination ? MAX_VISIBLE : totalCards;
    const config = (slot: number) => getSlotConfig(slotCount, slot);

    if (isFirstMount) isAnimating.current = true;

    let completedCount = 0;
    const visibleCount = visibleMap.size;
    const onCardDone = () => {
      if (++completedCount >= visibleCount) {
        isAnimating.current = false;
        if (isFirstMount) hasEntered.current = true;
      }
    };

    cardElements.forEach((card, cardIndex) => {
      const slot = visibleMap.get(cardIndex);
      const wasVisible = previouslyVisible.has(cardIndex);

      if (slot !== undefined) {
        const { x, y, rot, scale, zIndex } = config(slot);
        const target = {
          x: `${x * multiplier}rem`,
          y: `${y * hMult}rem`,
          rotation: rot,
          scale,
          opacity: 1,
          zIndex,
        };

        if (reduzir) {
          gsap.set(card, target);
          onCardDone();
        } else if (isFirstMount) {
          gsap.set(card, {
            x: 0,
            y: `${12 * hMult}rem`,
            rotation: 0,
            scale: 0.5,
            opacity: 0,
          });
          gsap.to(card, {
            ...target,
            duration: 1.2,
            ease: "elastic.out(1.05,.78)",
            delay: 0.2 + slot * 0.06,
            onComplete: onCardDone,
          });
        } else if (!wasVisible) {
          const enterX = direction === "right" ? 40 : -40;
          gsap.set(card, {
            x: `${enterX}rem`,
            y: `${y * hMult}rem`,
            rotation: direction === "right" ? 30 : -30,
            scale: 0.5,
            opacity: 0,
          });
          gsap.to(card, {
            ...target,
            duration: 0.6,
            ease: "power2.out",
            onComplete: onCardDone,
          });
        } else {
          gsap.to(card, {
            ...target,
            duration: 0.5,
            ease: "power2.out",
            onComplete: onCardDone,
          });
        }
      } else if (wasVisible && !reduzir) {
        const exitX = direction === "right" ? -40 : 40;
        gsap.to(card, {
          x: `${exitX}rem`,
          opacity: 0,
          scale: 0.5,
          rotation: direction === "right" ? -30 : 30,
          duration: 0.4,
          ease: "power2.in",
          zIndex: 0,
        });
      } else if (isFirstMount || reduzir) {
        gsap.set(card, { opacity: 0, scale: 0.3, x: 0, y: 0, zIndex: 0 });
      }
    });

    prevVisible.current = new Set(visibleMap.keys());

    const visibleEntries: { el: HTMLElement; slot: number }[] = [];
    cardElements.forEach((el, i) => {
      const slot = visibleMap.get(i);
      if (slot !== undefined) visibleEntries.push({ el, slot });
    });
    visibleEntries.sort((a, b) => a.slot - b.slot);

    let activeSlot: number | null = null;
    let leaveTimer: ReturnType<typeof setTimeout> | null = null;
    const centerSlot = visibleEntries.length >> 1;

    const updateHoverLayout = (hoveredSlot: number | null) => {
      if (reduzir) return;
      const mult = getResponsiveMultiplier(window.innerWidth);
      const hM = getHeightMultiplier(window.innerWidth);

      visibleEntries.forEach(({ el, slot }) => {
        const base = config(slot);
        let targetX = base.x * mult;
        let targetY = base.y * hM;
        let targetRot = base.rot;
        let targetScale = base.scale;
        let delay = 0;

        if (hoveredSlot !== null) {
          const distance = Math.abs(slot - hoveredSlot);
          delay = distance * 0.02;

          if (slot === hoveredSlot) {
            targetY -= 2.5 * hM;
            targetScale *= 1.08;
          } else {
            const normalized =
              centerSlot > 0 ? (slot - centerSlot) / centerSlot : 0;
            const pushStrength =
              8 *
              (1 - Math.abs(normalized)) *
              (1 + 0.2 * Math.max(0, 3 - distance));

            if (slot < hoveredSlot) {
              targetX -= pushStrength * mult;
              targetRot -= 3 / (distance + 1);
            } else {
              targetX += pushStrength * mult;
              targetRot += 3 / (distance + 1);
            }

            if (slot === visibleEntries.length - 1 && hoveredSlot < centerSlot)
              targetY -= 1 * hM;
            if (slot === 0 && hoveredSlot > centerSlot) targetY -= 1 * hM;
          }
        } else {
          delay = Math.abs(slot - centerSlot) * 0.02;
        }

        gsap.to(el, {
          x: `${targetX}rem`,
          y: `${targetY}rem`,
          rotation: targetRot,
          scale: targetScale,
          duration: 0.5,
          delay,
          ease: "elastic.out(1,.75)",
          overwrite: "auto",
        });
        gsap.set(el, { zIndex: base.zIndex });
      });
    };

    const enterHandlers = visibleEntries.map(({ el, slot }) => {
      const handler = () => {
        if (isAnimating.current || reduzir) return;
        if (leaveTimer) {
          clearTimeout(leaveTimer);
          leaveTimer = null;
        }
        if (activeSlot !== slot) {
          activeSlot = slot;
          updateHoverLayout(slot);
        }
      };
      el.addEventListener("mouseenter", handler);
      return { el, handler };
    });

    const onMouseLeave = () => {
      if (isAnimating.current || reduzir) return;
      if (leaveTimer) clearTimeout(leaveTimer);
      leaveTimer = setTimeout(() => {
        activeSlot = null;
        updateHoverLayout(null);
      }, 50);
    };
    container.addEventListener("mouseleave", onMouseLeave);

    const onResize = () => {
      if (!isAnimating.current) updateHoverLayout(activeSlot);
    };
    window.addEventListener("resize", onResize);

    return () => {
      enterHandlers.forEach(({ el, handler }) =>
        el.removeEventListener("mouseenter", handler)
      );
      container.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", onResize);
      if (leaveTimer) clearTimeout(leaveTimer);
      gsap.killTweensOf(cardElements);
    };
  }, [centerIndex, totalCards, getVisibleMap, needsPagination]);

  if (!totalCards) return null;

  const arrowClass = tone === "on-color" ? ARROW_ON_COLOR : ARROW_LIGHT;
  const dotOn =
    tone === "on-color" ? "bg-white scale-[1.3]" : "bg-black/70 scale-[1.3]";
  const dotOff = tone === "on-color" ? "bg-white/25" : "bg-black/15";

  const chevron = (direction: "left" | "right") => (
    <svg
      className="relative z-2 h-4 w-4 md:h-5 md:w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline
        points={direction === "left" ? "15 18 9 12 15 6" : "9 18 15 12 9 6"}
      />
    </svg>
  );

  return (
    <div className="relative z-20 flex w-full flex-col items-center px-4 py-4 md:px-8 lg:py-8">
      <div className="flex w-full max-w-360 items-center justify-center">
        <div
          ref={containerRef}
          className="fan-layout relative flex w-full max-w-7xl items-center justify-center"
        >
          {cards.map((card, index) => {
            const image = (
              <div className="relative h-full w-full overflow-hidden">
                <FanMedia card={card} index={index} />
                {card.alt ? (
                  <div className="fan-card__caption">
                    <p>{card.alt}</p>
                  </div>
                ) : null}
              </div>
            );
            return card.linkUrl ? (
              <a
                key={`${card.linkUrl}-${index}`}
                href={card.linkUrl}
                target={card.linkUrl.startsWith("http") ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className="fan-card block cursor-pointer"
                aria-label={card.alt || `Card ${index + 1}`}
              >
                {image}
              </a>
            ) : (
              <div key={index} className="fan-card">
                {image}
              </div>
            );
          })}
        </div>
      </div>

      {needsPagination && (
        <div className="z-30 mt-4 flex items-center justify-center gap-4 md:mt-6">
          <button
            type="button"
            className={`${arrowClass} h-10 w-10 md:h-12 md:w-12`}
            onClick={() => cycle("left")}
            aria-label="Anterior"
          >
            {chevron("left")}
          </button>
          <div className="flex items-center gap-2">
            {cards.map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full transition-all duration-300 ${i === centerIndex ? dotOn : dotOff}`}
              />
            ))}
          </div>
          <button
            type="button"
            className={`${arrowClass} h-10 w-10 md:h-12 md:w-12`}
            onClick={() => cycle("right")}
            aria-label="Próximo"
          >
            {chevron("right")}
          </button>
        </div>
      )}
    </div>
  );
}
