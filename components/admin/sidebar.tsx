"use client";

/**
 * Sidebar do painel com GradientMenu vertical.
 * Gradientes = `CORES_PAINEL_NAV` (mesmas cores da sidebar atual).
 * Chrome claro (`bg-sidebar`) para não quebrar o visual do painel.
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
  IoLeafOutline,
  IoPeopleOutline,
  IoClipboardOutline,
  IoHomeOutline,
} from "react-icons/io5";

import {
  GradientMenu,
  type GradientMenuItem,
} from "@/components/ui/gradient-menu";
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
  "/painel/legado": IoLeafOutline,
  "/painel/inscricoes-eventos": IoGridOutline,
  "/painel/eventos": IoCalendarOutline,
  "/painel/testemunhos": IoChatbubbleEllipsesOutline,
  "/painel/admin/usuarios": IoPeopleOutline,
};

export type AdminSidebarLink = {
  href: string;
  label: string;
};

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
  const items: GradientMenuItem[] = links.map((link) => ({
    title: link.label,
    to: link.href,
    icon: ICONES[link.href] ?? IoGridOutline,
    end: link.href === "/painel",
    ...gradientePainel(link.href),
  }));

  return (
    <aside
      className={cn(
        "sticky top-0 z-20 flex h-svh w-[72px] shrink-0 flex-col border-r border-border bg-sidebar p-3 text-sidebar-foreground shadow-sm transition-all lg:w-[260px]",
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
        <div className="hidden min-w-0 lg:block">
          <p className="truncate text-sm font-semibold">{titulo}</p>
          <p className="truncate text-xs text-muted-foreground">{subtitulo}</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-visible py-1">
        <GradientMenu
          items={items}
          orientation="vertical"
          variant="painel"
          activeGradient
          compact
          className="items-center gap-3 lg:items-start"
        />
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <Link
          href={logoutHref}
          title="Voltar ao site"
          className={cn(
            "group relative mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-muted-foreground shadow-lg transition-all duration-500",
            "hover:w-[140px] hover:shadow-none hover:text-foreground",
            "focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:outline-none",
            "lg:mx-0"
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
