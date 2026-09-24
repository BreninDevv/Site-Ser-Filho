"use client";

import {
  GradientMenu,
  type GradientMenuItem,
} from "@/components/ui/gradient-menu";
import {
  itemPainelGradient,
  itemUnicasGradient,
  siteGradientNavItems,
} from "@/components/site-header";

/** Nav desktop do site público — GradientMenu com cores de `cores-marca`. */
export function PublicGradientNav({
  hrefPainel,
  mostrarUnicas = false,
}: {
  hrefPainel?: string | null;
  /** Só true para feminino/mulher ou Dev (testes). */
  mostrarUnicas?: boolean;
}) {
  const items: GradientMenuItem[] = [
    ...siteGradientNavItems,
    ...(mostrarUnicas ? [itemUnicasGradient] : []),
    ...(hrefPainel ? [itemPainelGradient(hrefPainel)] : []),
  ];

  return (
    <GradientMenu
      items={items}
      orientation="horizontal"
      variant="site"
      activeGradient
      compact
      className="gap-3"
    />
  );
}
