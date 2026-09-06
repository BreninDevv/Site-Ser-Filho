"use client";

import { useState } from "react";

export function CopiarTextoButton({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      className="mt-2 text-xs font-semibold underline underline-offset-2"
    >
      {copiado ? "Chave copiada" : "Copiar chave"}
    </button>
  );
}
