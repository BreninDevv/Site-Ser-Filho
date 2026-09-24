/** Cores compartilhadas do menu público e do painel. */

export const COR_HOMEM = "#2563eb";
export const COR_MULHER = "#ec4899";

export const CORES_FLUIDO_MENU: Record<
  string,
  { cursorColor: string; cursorText: "light" | "dark" }
> = {
  "/inicio": { cursorColor: "#000000", cursorText: "light" },
  "/celulas": { cursorColor: "#4a8bc2", cursorText: "light" },
  "/eventos": { cursorColor: "#e25555", cursorText: "light" },
  "/inicio#testemunhos": { cursorColor: "#ffb347", cursorText: "dark" },
  "/encontro-com-deus": { cursorColor: "#4b6f36", cursorText: "light" },
  "/legado-de-cristo": { cursorColor: "#c6ff00", cursorText: "dark" },
  "/unicas": { cursorColor: "#C11C53", cursorText: "light" },
  "/painel": { cursorColor: "#0b3d91", cursorText: "light" },
};

/** Accent do item ativo na sidebar do painel. */
export const CORES_PAINEL_NAV: Record<
  string,
  { accent: string; textOnAccent: "light" | "dark" }
> = {
  "/painel": { accent: "#89CFF0", textOnAccent: "dark" }, // Dashboard — azul bebê
  "/painel/planilha-inscricoes": { accent: "#5b9a8b", textOnAccent: "light" }, // Planilha
  "/painel/encontro": { accent: "#4b6f36", textOnAccent: "light" }, // De Volta ao Jardim
  "/painel/legado": { accent: "#c6ff00", textOnAccent: "dark" }, // Legado
  "/painel/inscricoes-eventos": { accent: "#8b5cf6", textOnAccent: "light" }, // Inscrições
  "/painel/eventos": { accent: "#e25555", textOnAccent: "light" }, // Eventos
  "/painel/testemunhos": { accent: "#ffb347", textOnAccent: "dark" }, // Testemunhos
  "/painel/unicas-midia": { accent: "#C11C53", textOnAccent: "light" }, // Únicas
  "/painel/solicitacoes-perfil": { accent: "#0ea5e9", textOnAccent: "light" }, // Pedidos
  "/painel/admin/usuarios": { accent: "#0b3d91", textOnAccent: "light" }, // Admin
};

export function corPainelNav(href: string) {
  return (
    CORES_PAINEL_NAV[href] ?? { accent: "#141412", textOnAccent: "light" as const }
  );
}
