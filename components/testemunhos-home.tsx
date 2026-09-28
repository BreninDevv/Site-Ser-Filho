"use client";

import { useMemo } from "react";

import { INSTAGRAM_SER_FILHO } from "@/lib/midia";
import { TestemunhosMotion } from "@/components/testemunhos-motion";
import SocialCards from "@/components/ui/card-fan-carousel";

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

export function TestemunhosHome({ itens }: { itens: TestemunhoHome[] }) {
  const lista = useMemo(
    () => itens.filter((item) => Boolean(item.destino)),
    [itens]
  );

  const cards = useMemo(
    () =>
      lista.map((item) => ({
        imgUrl: item.previa,
        alt: nomeCurto(item.nome || "Testemunho"),
        linkUrl: item.destino,
        video: item.video,
      })),
    [lista]
  );

  return (
    <div className="testemunhos-carousel-band testemunhos-carousel-band--solo">
      <TestemunhosMotion />
      <div className="testemunhos-carousel-inner">
        <div className="testemunhos-header testemunhos-header--dark">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
              Histórias
            </p>
            <h2 className="font-heading text-4xl font-bold tracking-tight text-white">
              Testemunhos
            </h2>
          </div>
          <p className="max-w-sm text-sm text-white/60">
            Histórias reais de pessoas que encontraram algo novo dentro do Ser
            Filho.
          </p>
        </div>

        {lista.length === 0 ? (
          <p className="py-16 text-center text-sm text-white/50">
            Nenhum testemunho publicado ainda.
          </p>
        ) : (
          <SocialCards cards={cards} tone="on-color" />
        )}

        <div className="testemunhos-reveal mt-6 text-center" data-reveal="cta">
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
