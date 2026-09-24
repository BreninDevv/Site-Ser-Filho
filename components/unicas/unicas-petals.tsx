"use client";

import { useEffect, useId, useRef, type CSSProperties } from "react";

/** 12 pétalas de rosa — tamanhos/ângulos variados, delays negativos = já em queda. */
const BASE_CONFIG = [
  { size: 34, duration: 14, delay: -2, sway: -28, tone: "deep", rotate: -12 },
  { size: 26, duration: 12, delay: -5, sway: 22, tone: "soft", rotate: 18 },
  { size: 40, duration: 16, delay: -1, sway: -10, tone: "blush", rotate: -8 },
  { size: 22, duration: 11, delay: -7, sway: 30, tone: "deep", rotate: 25 },
  { size: 32, duration: 13, delay: -3.5, sway: -18, tone: "soft", rotate: -20 },
  { size: 38, duration: 15, delay: -9, sway: 8, tone: "deep", rotate: 10 },
  { size: 24, duration: 10, delay: -4, sway: -14, tone: "blush", rotate: -28 },
  { size: 30, duration: 12, delay: -6.5, sway: 24, tone: "soft", rotate: 15 },
  { size: 36, duration: 14, delay: -0.5, sway: -6, tone: "deep", rotate: -5 },
  { size: 28, duration: 11, delay: -8, sway: 16, tone: "blush", rotate: 22 },
  { size: 20, duration: 13, delay: -2.5, sway: -20, tone: "soft", rotate: -15 },
  { size: 33, duration: 15, delay: -10, sway: 12, tone: "deep", rotate: 8 },
] as const;

const LEFTS = [
  "4%",
  "12%",
  "20%",
  "28%",
  "36%",
  "44%",
  "52%",
  "60%",
  "68%",
  "76%",
  "84%",
  "92%",
];

/** Forma orgânica de pétala de rosa (path SVG). */
function RosaPetalSvg({ tone, uid }: { tone: string; uid: string }) {
  const gid = `${uid}-${tone}`;
  const fills = {
    deep: { a: "#9B153F", b: "#C11C53", c: "#E84A6F" },
    soft: { a: "#C11C53", b: "#F26569", c: "#F8A0A3" },
    blush: { a: "#D4206A", b: "#F26569", c: "#F4D7CE" },
  }[tone] ?? { a: "#C11C53", b: "#F26569", c: "#F8A0A3" };

  return (
    <svg
      className="petal-svg"
      viewBox="0 0 60 80"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`fill-${gid}`} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor={fills.c} />
          <stop offset="45%" stopColor={fills.b} />
          <stop offset="100%" stopColor={fills.a} />
        </linearGradient>
        <radialGradient id={`shine-${gid}`} cx="35%" cy="30%" r="55%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id={`soft-${gid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="1.5"
            stdDeviation="1.2"
            floodColor="#3A232D"
            floodOpacity="0.22"
          />
        </filter>
      </defs>
      {/* Contorno clássico de pétala de rosa */}
      <path
        d="M30 4
           C42 8 54 22 56 38
           C58 52 50 66 38 74
           C34 76 31 78 30 78
           C29 78 26 76 22 74
           C10 66 2 52 4 38
           C6 22 18 8 30 4 Z"
        fill={`url(#fill-${gid})`}
        filter={`url(#soft-${gid})`}
      />
      <path
        d="M30 4
           C42 8 54 22 56 38
           C58 52 50 66 38 74
           C34 76 31 78 30 78
           C29 78 26 76 22 74
           C10 66 2 52 4 38
           C6 22 18 8 30 4 Z"
        fill={`url(#shine-${gid})`}
      />
      {/* Nervura central sutil */}
      <path
        d="M30 12 C31 28 31 48 30 72"
        fill="none"
        stroke={fills.a}
        strokeWidth="1.1"
        strokeOpacity="0.28"
        strokeLinecap="round"
      />
      <path
        d="M30 28 C22 36 18 48 20 60"
        fill="none"
        stroke={fills.a}
        strokeWidth="0.7"
        strokeOpacity="0.18"
        strokeLinecap="round"
      />
      <path
        d="M30 28 C38 36 42 48 40 60"
        fill="none"
        stroke={fills.a}
        strokeWidth="0.7"
        strokeOpacity="0.18"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Pétalas de rosa reais (SVG) + influência do cursor. */
export function UnicasPetals() {
  const petalsContainerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef(0);
  const uid = useId().replace(/:/g, "");

  useEffect(() => {
    const container = petalsContainerRef.current;
    if (!container) return;

    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduzir.matches) {
      container.setAttribute("data-reduced-motion", "true");
      return;
    }

    mouseRef.current.x = window.innerWidth / 2;
    mouseRef.current.y = window.innerHeight / 2;

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    document.addEventListener("mousemove", handleMouseMove, { passive: true });

    const animate = () => {
      const centerX = window.innerWidth / 2 || 1;
      const centerY = window.innerHeight / 2 || 1;

      const normX = (mouseRef.current.x / centerX - 1) * 0.4;
      const normY = (mouseRef.current.y / centerY - 1) * 0.3;

      container.style.setProperty("--mouse-influence-x", String(normX));
      container.style.setProperty("--mouse-influence-y", String(normY));

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return (
    <div
      ref={petalsContainerRef}
      className="unicas-petals-container"
      aria-hidden="true"
    >
      {BASE_CONFIG.map((config, index) => (
        <div
          key={index}
          className={`petal petal--${config.tone}`}
          style={
            {
              left: LEFTS[index],
              width: config.size,
              height: Math.round(config.size * 1.35),
              "--petal-duration": `${config.duration}s`,
              "--petal-delay": `${config.delay}s`,
              "--petal-sway": `${config.sway}px`,
              "--petal-spin": `${config.rotate}deg`,
            } as CSSProperties
          }
        >
          <RosaPetalSvg tone={config.tone} uid={`${uid}-${index}`} />
        </div>
      ))}
    </div>
  );
}
