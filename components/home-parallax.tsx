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
    const blocks = sections.map((section) =>
      [...section.children].filter(
        (el): el is HTMLElement =>
          el instanceof HTMLElement &&
          !el.classList.contains("home-parallax-bg")
      )
    );
    const backgrounds = sections.map((section) =>
      section.querySelector<HTMLElement>(".home-parallax-bg")
    );
    const appliedY = new WeakMap<HTMLElement, number>();
    let frame = 0;
    let lastWidth = window.innerWidth;

    const clamp = (value: number) => Math.min(1, Math.max(0, value));
    const phone = () =>
      window.innerWidth < 1024 ||
      window.matchMedia("(pointer: coarse)").matches;

    const layoutTop = (el: HTMLElement) =>
      el.getBoundingClientRect().top - (appliedY.get(el) ?? 0);

    const clearMotion = () => {
      sections.forEach((section, index) => {
        section.style.transform = "";
        section.style.zIndex = "";
        appliedY.delete(section);
        const bg = backgrounds[index];
        if (bg) {
          bg.style.backgroundPosition = "";
          bg.style.transform = "";
        }
        blocks[index]?.forEach((block) => {
          block.style.transform = "";
          block.style.opacity = "";
        });
      });
    };

    const update = () => {
      frame = 0;

      const vh = window.innerHeight;
      const light = phone();

      sections.forEach((section, index) => {
        const top = layoutTop(section);
        const height = section.offsetHeight || 1;
        const bg = backgrounds[index];
        const content = blocks[index] ?? [];
        if (top > vh * 1.25 || top + height < -vh * 0.4) return;

        section.style.zIndex = String(index + 1);

        if (bg) {
          const ratio = vh / (vh + height);
          const from = index === 0 ? 0 : -vh * ratio;
          const to = vh * (1 - ratio);
          const startTop = index === 0 ? 0 : vh;
          const span = startTop + height || 1;
          const progress = clamp((startTop - top) / span);
          const y = from + (to - from) * progress;
          bg.style.transform = `translate3d(0, ${y * (light ? 0.08 : 0.15)}px, 0)`;
        }

        if (index === 0) {
          section.style.transform = "";
          appliedY.set(section, 0);
          const leave = clamp(-top / (height * 0.7));
          const drift = light ? -36 : -80;
          content.forEach((block) => {
            block.style.transform = `translate3d(0, ${leave * drift}px, 0)`;
            block.style.opacity = String(1 - leave * (light ? 0.2 : 0.45));
          });
          return;
        }

        const enter = clamp((vh - top) / (vh * 0.62));
        const rise =
          (1 - enter) *
          (light ? Math.min(110, vh * 0.16) : Math.min(150, vh * 0.22));
        section.style.transform = `translate3d(0, ${rise}px, 0)`;
        appliedY.set(section, rise);

        const shift = light ? 36 : 64;
        content.forEach((block, blockIndex) => {
          const local = clamp((enter - blockIndex * 0.14) / 0.72);
          block.style.transform = `translate3d(0, ${(1 - local) * shift}px, 0)`;
          block.style.opacity = String((light ? 0.45 : 0.15) + local * (light ? 0.55 : 0.85));
        });
      });
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    const onResize = () => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      update();
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (frame) window.cancelAnimationFrame(frame);
      clearMotion();
    };
  }, []);

  return null;
}
