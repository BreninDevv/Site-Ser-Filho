"use client";

import { useEffect } from "react";

import "./home-parallax.css";

/**
 * Cada parte da home sobe para o lugar ao rolar para baixo
 * e desce de volta ao rolar para cima. O fundo também se desloca.
 */
export function HomeParallax() {
  useEffect(() => {
    const root = document.getElementById("inicio-home");
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const sections = [
      ...root.querySelectorAll<HTMLElement>(".home-parallax-section"),
    ];
    let frame = 0;

    const clamp = (value: number) => Math.min(1, Math.max(0, value));

    const layoutTop = (el: HTMLElement) => {
      const top = el.getBoundingClientRect().top;
      const transform = getComputedStyle(el).transform;
      if (!transform || transform === "none") return top;
      return top - new DOMMatrix(transform).m42;
    };

    const blocksOf = (section: HTMLElement) =>
      [...section.children].filter(
        (el): el is HTMLElement =>
          el instanceof HTMLElement &&
          !el.classList.contains("home-parallax-bg")
      );

    const update = () => {
      frame = 0;
      const vh = window.innerHeight;

      sections.forEach((section, index) => {
        const bg = section.querySelector<HTMLElement>(".home-parallax-bg");
        const height = section.offsetHeight || 1;
        const top = layoutTop(section);
        const blocks = blocksOf(section);
        section.style.zIndex = String(index + 1);

        if (bg) {
          const ratio = vh / (vh + height);
          const from = index === 0 ? 0 : -vh * ratio;
          const to = vh * (1 - ratio);
          const startTop = index === 0 ? 0 : vh;
          const span = startTop + height || 1;
          const progress = clamp((startTop - top) / span);
          const y = from + (to - from) * progress;
          bg.style.backgroundPosition = `50% ${y}px`;
        }

        if (index === 0) {
          section.style.transform = "";
          const leave = clamp(-top / (height * 0.7));
          blocks.forEach((block) => {
            block.style.transform = `translate3d(0, ${leave * -80}px, 0)`;
            block.style.opacity = String(1 - leave * 0.45);
          });
          return;
        }

        const enter = clamp((vh - top) / (vh * 0.62));
        const rise = (1 - enter) * Math.min(150, vh * 0.22);
        section.style.transform = `translate3d(0, ${rise}px, 0)`;

        blocks.forEach((block, blockIndex) => {
          const local = clamp((enter - blockIndex * 0.14) / 0.72);
          block.style.transform = `translate3d(0, ${(1 - local) * 64}px, 0)`;
          block.style.opacity = String(0.15 + local * 0.85);
        });
      });
    };

    const onScroll = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
