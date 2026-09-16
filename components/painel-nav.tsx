"use client";

import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  Flower2,
  LayoutDashboard,
  MessageSquareQuote,
  ScrollText,
  Table2,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  PainelCollapsibleShell,
  type SidebarLinkItem,
} from "@/components/ui/dashboard-with-collapsible-sidebar";

export function PainelNav({
  titulo,
  subtitulo,
  mostrarDashboard,
  mostrarEncontro,
  mostrarMidia,
  mostrarAdmin,
  mostrarInscricoesEventos,
  mostrarPlanilha,
  children,
}: {
  titulo: string;
  subtitulo: string;
  mostrarDashboard: boolean;
  mostrarEncontro: boolean;
  mostrarMidia: boolean;
  mostrarAdmin: boolean;
  mostrarInscricoesEventos: boolean;
  mostrarPlanilha: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const links = (
    [
      mostrarDashboard && {
        href: "/painel",
        label: "Dashboard",
        icon: LayoutDashboard,
      },
      mostrarPlanilha && {
        href: "/painel/planilha-inscricoes",
        label: "Planilha de inscrições",
        icon: Table2,
      },
      mostrarEncontro && {
        href: "/painel/encontro",
        label: "De Volta ao Jardim",
        icon: Flower2,
      },
      mostrarEncontro && {
        href: "/painel/legado",
        label: "Legado",
        icon: ScrollText,
      },
      mostrarInscricoesEventos && {
        href: "/painel/inscricoes-eventos",
        label: "Inscrições de eventos",
        icon: ClipboardList,
      },
      mostrarMidia && {
        href: "/painel/eventos",
        label: "Eventos",
        icon: CalendarDays,
      },
      mostrarMidia && {
        href: "/painel/testemunhos",
        label: "Testemunhos",
        icon: MessageSquareQuote,
      },
      mostrarAdmin && {
        href: "/painel/admin/usuarios",
        label: "Admin · Usuários",
        icon: Users,
      },
    ] as Array<(SidebarLinkItem & { icon: LucideIcon }) | false>
  ).filter((link): link is SidebarLinkItem => Boolean(link));

  return (
    <PainelCollapsibleShell
      titulo={titulo}
      subtitulo={subtitulo}
      links={links}
      pathname={pathname}
    >
      {children}
    </PainelCollapsibleShell>
  );
}
