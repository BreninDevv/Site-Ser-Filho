"use client";

import { useEffect, useState } from "react";

export function Typewriter({ palavras }: { palavras: string[] }) {
  const [indice, setIndice] = useState(0);
  const [texto, setTexto] = useState("");
  const [apagando, setApagando] = useState(false);

  useEffect(() => {
    const palavra = palavras[indice];
    let espera: ReturnType<typeof setTimeout>;

    if (!apagando && texto === palavra) {
      espera = setTimeout(() => setApagando(true), 1600);
    } else if (apagando && texto === "") {
      setApagando(false);
      setIndice((atual) => (atual + 1) % palavras.length);
    } else {
      espera = setTimeout(
        () => {
          setTexto(palavra.slice(0, texto.length + (apagando ? -1 : 1)));
        },
        apagando ? 36 : 70
      );
    }

    return () => clearTimeout(espera);
  }, [apagando, indice, palavras, texto]);

  return (
    <span className="inline-flex min-h-[1.2em] items-end">
      {texto}
      <span
        aria-hidden
        className="ml-0.5 inline-block h-[0.95em] w-px animate-pulse bg-tertiary"
      />
    </span>
  );
}
