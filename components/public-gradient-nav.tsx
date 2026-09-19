"use client";

import {
  GradientMenu,
  type GradientMenuItem,
} from "@/components/ui/gradient-menu";
import {
  itemPainelGradient,
  siteGradientNavItems,
} from "@/components/site-header";

/** Nav desktop do site público — GradientMenu com cores de `cores-marca`. */
export function PublicGradientNav({
  hrefPainel,
}: {
  hrefPainel?: string | null;
}) {
  const items: GradientMenuItem[] = [
    ...siteGradientNavItems,
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
