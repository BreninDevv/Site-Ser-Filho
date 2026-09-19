"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import {
  AdminSidebar,
  itensGradientPainel,
  type AdminSidebarLink,
} from "@/components/admin/sidebar";
import { GradientMenu } from "@/components/ui/gradient-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    setAberto(false);
  }, [pathname]);

  const links = (
    [
      mostrarDashboard && {
        href: "/painel",
        label: "Dashboard",
      },
      mostrarPlanilha && {
        href: "/painel/planilha-inscricoes",
        label: "Planilha",
      },
      mostrarEncontro && {
        href: "/painel/encontro",
        label: "Jardim",
      },
      mostrarEncontro && {
        href: "/painel/legado",
        label: "Legado",
      },
      mostrarInscricoesEventos && {
        href: "/painel/inscricoes-eventos",
        label: "Inscrições",
      },
      mostrarMidia && {
        href: "/painel/eventos",
        label: "Eventos",
      },
      mostrarMidia && {
        href: "/painel/testemunhos",
        label: "Testemunhos",
      },
      mostrarAdmin && {
        href: "/painel/admin/usuarios",
        label: "Admin",
      },
    ] as Array<AdminSidebarLink | false>
  ).filter((link): link is AdminSidebarLink => Boolean(link));

  const items = itensGradientPainel(links);

  return (
    <div className="flex min-h-full min-w-0 w-full flex-col bg-background text-foreground lg:flex-row">
      {/* Topo mobile — igual ao site: hamburger + sheet */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-3 py-2 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2">
          <Image
            src="/logo-ser-filho.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-full border border-border bg-white object-contain p-1"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{titulo}</p>
            <p className="truncate text-xs text-muted-foreground">{subtitulo}</p>
          </div>
          <Sheet open={aberto} onOpenChange={setAberto}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menu do painel">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(20rem,92vw)]">
              <SheetHeader>
                <SheetTitle>Painel</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-5 px-4 pb-6">
                <GradientMenu
                  items={items}
                  orientation="vertical"
                  variant="painel"
                  activeGradient
                  compact
                  instantNav
                  onNavigate={() => setAberto(false)}
                  className="w-full items-stretch gap-3"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full rounded-full"
                  asChild
                >
                  <Link href="/inicio" onClick={() => setAberto(false)}>
                    Voltar ao site
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <AdminSidebar titulo={titulo} subtitulo={subtitulo} links={links} />

      <main className="min-w-0 flex-1 overflow-x-auto overflow-y-auto bg-muted/30 p-3 sm:p-4 md:p-6">
        <div className="mx-auto w-full max-w-5xl min-w-0">{children}</div>
      </main>
    </div>
  );
}
