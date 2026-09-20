"use client";

/**
 * Intersection Observer para #testemunhos (carrossel escuro).
 */
import { useEffect } from "react";

import "./testemunhos-featured.css";

export function TestemunhosMotion() {
  useEffect(() => {
    const section = document.getElementById("testemunhos");
    if (!section) return;

    section.classList.add("testemunhos-section");

    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduzir) {
      section.classList.add("is-inview", "reduce-motion");
      return;
    }

    const observer = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada?.isIntersecting) return;
        section.classList.add("is-inview");
        observer.disconnect();
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return null;
}
