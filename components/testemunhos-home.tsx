"use client";

import { useEffect, useState } from "react";

export type TestemunhoHome = {
  nome: string;
  embed: string;
};

export function TestemunhosHome({ itens }: { itens: TestemunhoHome[] }) {
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (itens.length <= 1 || pausado) return;
    const timer = setInterval(() => {
      setIndice((atual) => (atual + 1) % itens.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [itens.length, pausado]);

  if (itens.length === 0) {
    return (
      <div className="grid justify-items-center gap-6 sm:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <CartaoVazio key={n} />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="sm:hidden">
        <CartaoVideo
          item={itens[indice]}
          onAssistir={() => setPausado(true)}
        />
        {itens.length > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            {itens.map((item, i) => (
              <button
                key={item.nome + i}
                type="button"
                aria-label={`Ver testemunho ${i + 1}`}
                onClick={() => {
                  setIndice(i);
                  setPausado(true);
                }}
                className={`h-2 w-2 rounded-full ${
                  i === indice ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>
      <div className="hidden gap-6 sm:grid sm:grid-cols-3 sm:justify-items-center">
        {itens.map((item) => (
          <CartaoVideo key={item.nome + item.embed} item={item} />
        ))}
      </div>
    </>
  );
}

function CartaoVideo({
  item,
  onAssistir,
}: {
  item: TestemunhoHome;
  onAssistir?: () => void;
}) {
  return (
    <div className="flex w-full max-w-[20rem] flex-col gap-3 rounded-2xl bg-white p-3 text-foreground shadow-[0_1rem_2.5rem_rgba(20,20,18,0.12)]">
      <div
        className="overflow-hidden rounded-xl bg-foreground"
        onPointerDown={onAssistir}
      >
        <iframe
          src={item.embed}
          title={item.nome}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          className="aspect-[9/16] w-full border-0"
        />
      </div>
      <p className="text-xs font-bold text-muted-foreground">{item.nome}</p>
    </div>
  );
}

function CartaoVazio() {
  return (
    <div className="flex w-full max-w-[20rem] flex-col rounded-2xl bg-white p-3 text-foreground shadow-[0_1rem_2.5rem_rgba(20,20,18,0.12)]">
      <div className="flex aspect-[9/16] items-center justify-center rounded-xl bg-foreground">
        <svg viewBox="0 0 24 24" className="h-8 w-8 fill-background">
          <polygon points="6,4 20,12 6,20" />
        </svg>
      </div>
    </div>
  );
}
