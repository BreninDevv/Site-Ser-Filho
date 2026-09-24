"use client";

/**
 * Sidebar do painel com GradientMenu vertical (desktop).
 * No celular o PainelNav usa sheet — esta sidebar fica oculta (`hidden lg:flex`).
 */
import Image from "next/image";
import Link from "next/link";
import type { IconType } from "react-icons";
import {
  IoCalendarOutline,
  IoChatbubbleEllipsesOutline,
  IoExitOutline,
  IoFlowerOutline,
  IoGridOutline,
  IoPeopleOutline,
  IoClipboardOutline,
  IoHomeOutline,
  IoRoseOutline,
  IoPersonOutline,
} from "react-icons/io5";

import {
  GradientMenu,
  type GradientMenuItem,
} from "@/components/ui/gradient-menu";
import { FingerprintMenuIcon } from "@/components/ui/fingerprint-icon";
import { MapPinLineMenuIcon } from "@/components/ui/map-pin-line-icon";
import { CORES_PAINEL_NAV } from "@/lib/ui/cores-marca";
import { cn } from "@/lib/utils";

function gradientePainel(href: string): Pick<
  GradientMenuItem,
  "gradientFrom" | "gradientTo"
> {
  const cor = CORES_PAINEL_NAV[href]?.accent ?? "#141412";
  return { gradientFrom: cor, gradientTo: cor };
}

const ICONES: Record<string, IconType> = {
  "/painel": IoHomeOutline,
  "/painel/planilha-inscricoes": IoClipboardOutline,
  "/painel/encontro": IoFlowerOutline,
  "/painel/legado": FingerprintMenuIcon,
  "/painel/inscricoes-eventos": IoGridOutline,
  "/painel/eventos": IoCalendarOutline,
  "/painel/testemunhos": IoChatbubbleEllipsesOutline,
  "/painel/unicas-midia": IoRoseOutline,
  "/painel/solicitacoes-perfil": IoPersonOutline,
  "/painel/admin/usuarios": IoPeopleOutline,
  "/painel/celulas": MapPinLineMenuIcon,
};

export type AdminSidebarLink = {
  href: string;
  label: string;
};

export function itensGradientPainel(
  links: AdminSidebarLink[]
): GradientMenuItem[] {
  return links.map((link) => ({
    title: link.label,
    to: link.href,
    icon: ICONES[link.href] ?? IoGridOutline,
    end: link.href === "/painel",
    ...gradientePainel(link.href),
  }));
}

export type AdminSidebarProps = {
  titulo?: string;
  subtitulo?: string;
  links: AdminSidebarLink[];
  logoutHref?: string;
  className?: string;
};

export function AdminSidebar({
  titulo = "Ser Filho",
  subtitulo = "Painel",
  links,
  logoutHref = "/inicio",
  className,
}: AdminSidebarProps) {
  const items = itensGradientPainel(links);

  return (
    <aside
      className={cn(
        "sticky top-0 z-20 hidden h-svh w-[260px] shrink-0 flex-col border-r border-border bg-sidebar p-3 text-sidebar-foreground shadow-sm lg:flex",
        className
      )}
    >
      <div className="mb-5 flex items-center gap-3 px-1">
        <Image
          src="/logo-ser-filho.png"
          alt=""
          width={36}
          height={36}
          className="h-9 w-9 shrink-0 rounded-full border border-border bg-white object-contain p-1"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{titulo}</p>
          <p className="truncate text-xs text-muted-foreground">{subtitulo}</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        <GradientMenu
          items={items}
          orientation="vertical"
          variant="painel"
          activeGradient
          compact
          className="items-start gap-3"
        />
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <Link
          href={logoutHref}
          title="Voltar ao site"
          className={cn(
            "group relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-muted-foreground shadow-lg transition-all duration-500",
            "hover:w-[140px] hover:shadow-none hover:text-foreground",
            "focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:outline-none"
          )}
          aria-label="Voltar ao site"
        >
          <IoExitOutline
            className="text-xl transition-all duration-500 group-hover:scale-0"
            aria-hidden
          />
          <span className="absolute scale-0 text-[11px] tracking-wide uppercase transition-all delay-150 duration-500 group-hover:scale-100">
            Sair
          </span>
        </Link>
      </div>
    </aside>
  );
}

export default AdminSidebar;
