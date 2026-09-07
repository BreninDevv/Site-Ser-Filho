"use client";

import { useEffect, useState } from "react";
import { Caveat } from "next/font/google";
import { cn } from "@/lib/utils";

const caveat = Caveat({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700"],
});

type HandwritingTextProps = {
  words: string[];
  className?: string;
  height?: string;
};

export function HandwritingText({
  words,
  className,
  height = "1.15em",
}: HandwritingTextProps) {
  const [indice, setIndice] = useState(0);
  const palavra = words[indice] ?? "";

  useEffect(() => {
    if (words.length <= 1) return;
    const troca = window.setTimeout(() => {
      setIndice((atual) => (atual + 1) % words.length);
    }, 4200);
    return () => window.clearTimeout(troca);
  }, [indice, words.length]);

  return (
    <span
      className={cn("inline-flex items-center justify-center", className)}
      style={{ height }}
    >
      <svg
        key={`${palavra}-${indice}`}
        viewBox="0 0 920 200"
        className={cn("w-full overflow-visible", caveat.className)}
        style={{ height, width: "auto" }}
        role="img"
        aria-label={palavra}
      >
        <text
          x="50%"
          y="72%"
          textAnchor="middle"
          className="handwriting-ink"
          style={{ fontSize: 118, fontWeight: 700 }}
        >
          {palavra}
        </text>
      </svg>
    </span>
  );
}
