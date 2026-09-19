"use client";

/**
 * Header flutuante com GradientMenu.
 * Gradientes = cores já usadas em `CORES_FLUIDO_MENU` (não altera a paleta do site).
 */
import Image from "next/image";
import Link from "next/link";
import {
  IoFlowerOutline,
  IoGridOutline,
  IoHomeOutline,
  IoCalendarOutline,
  IoChatbubbleEllipsesOutline,
  IoLeafOutline,
  IoSettingsOutline,
} from "react-icons/io5";

import {
  GradientMenu,
  type GradientMenuItem,
} from "@/components/ui/gradient-menu";
import { CORES_FLUIDO_MENU } from "@/lib/ui/cores-marca";
import { cn } from "@/lib/utils";

/** Mantém a cor oficial nos dois extremos do gradiente 45°. */
function gradienteMarca(href: string): Pick<
  GradientMenuItem,
  "gradientFrom" | "gradientTo"
> {
  const cor = CORES_FLUIDO_MENU[href]?.cursorColor ?? "#141412";
  return { gradientFrom: cor, gradientTo: cor };
}

export const siteGradientNavItems: GradientMenuItem[] = [
  {
    title: "Início",
    icon: IoHomeOutline,
    to: "/inicio",
    end: true,
    ...gradienteMarca("/inicio"),
  },
  {
    title: "Células",
    icon: IoGridOutline,
    to: "/celulas",
    ...gradienteMarca("/celulas"),
  },
  {
    title: "Eventos",
    icon: IoCalendarOutline,
    to: "/eventos",
    ...gradienteMarca("/eventos"),
  },
  {
    title: "Testemunhos",
    icon: IoChatbubbleEllipsesOutline,
    to: "/inicio#testemunhos",
    ...gradienteMarca("/inicio#testemunhos"),
  },
  {
    title: "Jardim",
    icon: IoFlowerOutline,
    to: "/encontro-com-deus",
    ...gradienteMarca("/encontro-com-deus"),
  },
  {
    title: "Legado",
    icon: IoLeafOutline,
    to: "/legado-de-cristo",
    ...gradienteMarca("/legado-de-cristo"),
  },
];

export type SiteHeaderProps = {
  className?: string;
  /** Extra: ex. link Painel com a cor oficial. */
  extraItems?: GradientMenuItem[];
  /** Avatar à direita (iniciais ou URL). */
  avatarLabel?: string;
};

export function SiteHeader({
  className,
  extraItems = [],
  avatarLabel = "SF",
}: SiteHeaderProps) {
  const items = [
    ...siteGradientNavItems,
    ...extraItems.map((item) => ({
      ...item,
      ...(item.gradientFrom
        ? {}
        : gradienteMarca(item.to.split("#")[0] || item.to)),
    })),
  ];

  return (
    <header
      className={cn(
        "fixed top-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3",
        className
      )}
    >
      <Link
        href="/inicio"
        className="hidden shrink-0 items-center gap-2 sm:flex"
        aria-label="Ser Filho — início"
      >
        <Image
          src="/logo-ser-filho.png"
          alt=""
          width={40}
          height={40}
          className="h-9 w-auto"
          priority
        />
        <span className="logo-gradient-text text-sm font-semibold tracking-wide">
          Ser Filho
        </span>
      </Link>

      <div className="rounded-full border border-white/15 bg-white/10 p-2 shadow-xl backdrop-blur-xl">
        <GradientMenu
          items={items}
          orientation="horizontal"
          variant="site"
          activeGradient
        />
      </div>

      <div
        className="avatar-gradient-ring hidden h-11 w-11 items-center justify-center rounded-full p-[2px] sm:flex"
        aria-hidden
      >
        <span className="flex h-full w-full items-center justify-center rounded-full bg-[#0A0A0F] text-xs font-semibold text-white">
          {avatarLabel.slice(0, 2).toUpperCase()}
        </span>
      </div>
    </header>
  );
}

/** Item Painel com a cor já usada no menu fluido. */
export function itemPainelGradient(to: string): GradientMenuItem {
  return {
    title: "Painel",
    icon: IoSettingsOutline,
    to,
    ...gradienteMarca("/painel"),
  };
}

export default SiteHeader;
