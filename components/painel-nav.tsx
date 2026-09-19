"use client";

import { AdminSidebar } from "@/components/admin/sidebar";

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
    ] as Array<{ href: string; label: string } | false>
  ).filter((link): link is { href: string; label: string } => Boolean(link));

  return (
    <div className="flex min-h-full min-w-0 w-full bg-background text-foreground">
      <AdminSidebar titulo={titulo} subtitulo={subtitulo} links={links} />
      <main className="min-w-0 flex-1 overflow-x-clip overflow-y-auto bg-muted/30 p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
