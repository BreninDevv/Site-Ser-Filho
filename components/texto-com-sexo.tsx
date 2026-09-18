import type { CSSProperties, ReactNode } from "react";
import { COR_HOMEM, COR_MULHER } from "@/lib/ui/cores-marca";

const REGEX_SEXO = /(homens|homem|mulheres|mulher)/gi;

function corDaPalavra(palavra: string) {
  const p = palavra.toLowerCase();
  if (p === "homem" || p === "homens") return COR_HOMEM;
  if (p === "mulher" || p === "mulheres") return COR_MULHER;
  return undefined;
}

/**
 * Pinta Homem/Homens de azul e Mulher/Mulheres de rosa
 * em qualquer texto (títulos, células, filtros, etc.).
 */
export function TextoComSexo({
  children,
  className,
  style,
}: {
  children: string;
  className?: string;
  style?: CSSProperties;
}) {
  const partes = String(children).split(REGEX_SEXO);

  return (
    <span className={className} style={style}>
      {partes.map((parte, i) => {
        if (!parte) return null;
        const cor = corDaPalavra(parte);
        if (!cor) return <span key={`${parte}-${i}`}>{parte}</span>;
        return (
          <span
            key={`${parte}-${i}`}
            className="font-semibold"
            style={{ color: cor }}
          >
            {parte}
          </span>
        );
      })}
    </span>
  );
}

export function RotuloSexoColorido({
  sexo,
  children,
}: {
  sexo: string | null | undefined;
  children?: ReactNode;
}) {
  if (sexo === "masculino") {
    return (
      <span className="font-semibold" style={{ color: COR_HOMEM }}>
        {children ?? "Homem"}
      </span>
    );
  }
  if (sexo === "feminino") {
    return (
      <span className="font-semibold" style={{ color: COR_MULHER }}>
        {children ?? "Mulher"}
      </span>
    );
  }
  return <span>{children ?? "Não informado"}</span>;
}

/** Título de quadro/contador: Homens azul, Mulheres rosa. */
export function TituloSexo({ children }: { children: string }) {
  const lower = children.toLowerCase();
  if (/(homem|homens)/.test(lower)) {
    return (
      <span className="text-xs font-semibold" style={{ color: COR_HOMEM }}>
        {children}
      </span>
    );
  }
  if (/(mulher|mulheres)/.test(lower)) {
    return (
      <span className="text-xs font-semibold" style={{ color: COR_MULHER }}>
        {children}
      </span>
    );
  }
  return <span className="text-xs text-muted-foreground">{children}</span>;
}
