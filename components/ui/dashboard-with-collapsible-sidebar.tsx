"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronsRight, Home, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { corPainelNav } from "@/lib/ui/cores-marca";

export type SidebarLinkItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type PainelCollapsibleShellProps = {
  titulo: string;
  subtitulo: string;
  links: SidebarLinkItem[];
  pathname: string;
  children: React.ReactNode;
};

export function PainelCollapsibleShell({
  titulo,
  subtitulo,
  links,
  pathname,
  children,
}: PainelCollapsibleShellProps) {
  const [open, setOpen] = React.useState(true);

  React.useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const sync = () => setOpen(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return (
    <div className="flex min-h-full min-w-0 w-full bg-background text-foreground">
      <nav
        className={cn(
          "sticky top-0 z-20 relative flex h-svh shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground p-2 shadow-sm transition-all duration-300 ease-in-out",
          open ? "w-64" : "w-16"
        )}
      >
        <TitleSection open={open} titulo={titulo} subtitulo={subtitulo} />

        <div className="mb-16 min-h-0 flex-1 space-y-1 overflow-y-auto pb-2">
          {links.map((link) => (
            <Option
              key={link.href}
              href={link.href}
              Icon={link.icon}
              title={link.label}
              selected={isActivePath(pathname, link.href)}
              open={open}
            />
          ))}

          <div className="mt-4 space-y-1 border-t border-border pt-4">
            {open && (
              <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Conta
              </div>
            )}
            <Option
              href="/inicio"
              Icon={Home}
              title="Voltar ao site"
              selected={false}
              open={open}
            />
          </div>
        </div>

        <ToggleClose open={open} setOpen={setOpen} />
      </nav>

      <main className="min-w-0 flex-1 overflow-x-clip overflow-y-auto bg-muted/30 p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === "/painel") return pathname === "/painel";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type OptionProps = {
  href: string;
  Icon: LucideIcon;
  title: string;
  selected: boolean;
  open: boolean;
};

function Option({ href, Icon, title, selected, open }: OptionProps) {
  const { accent, textOnAccent } = corPainelNav(href);
  const eVoltar = href === "/inicio";
  const [hover, setHover] = React.useState(false);
  const ativo = selected || hover;

  const estiloAtivo =
    !eVoltar && ativo
      ? {
          backgroundColor: `${accent}40`,
          borderLeft: `3px solid ${accent}`,
          color: textOnAccent === "dark" ? "#141412" : undefined,
        }
      : eVoltar
        ? undefined
        : { borderLeft: "3px solid transparent" };

  return (
    <Link
      href={href}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn(
        "relative flex h-11 w-full items-center rounded-md transition-all duration-200",
        selected || hover
          ? "text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
      style={estiloAtivo}
    >
      <div className="grid h-full w-12 place-content-center">
        <Icon className="h-4 w-4" />
      </div>
      {open && (
        <span className="truncate pr-3 text-sm font-medium transition-opacity duration-200">
          {title}
        </span>
      )}
    </Link>
  );
}

function TitleSection({
  open,
  titulo,
  subtitulo,
}: {
  open: boolean;
  titulo: string;
  subtitulo: string;
}) {
  return (
    <div className="mb-6 border-b border-border pb-4">
      <div className="flex items-center gap-3 rounded-md p-2">
        <Logo />
        {open && (
          <div className="min-w-0 transition-opacity duration-200">
            <span className="block truncate text-sm font-semibold text-foreground">
              {titulo}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {subtitulo}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className="grid size-10 shrink-0 place-content-center overflow-hidden rounded-lg bg-foreground shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-ser-filho.png"
        alt="Ser Filho"
        width={40}
        height={40}
        className="h-10 w-10 object-cover"
      />
    </div>
  );
}

function ToggleClose({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <button
      type="button"
      onClick={() => setOpen((atual) => !atual)}
      className="absolute bottom-0 left-0 right-0 border-t border-border transition-colors hover:bg-muted/70"
      aria-label={open ? "Ocultar menu" : "Mostrar menu"}
    >
      <div className="flex items-center p-3">
        <div className="grid size-10 place-content-center">
          <ChevronsRight
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-300",
              open && "rotate-180"
            )}
          />
        </div>
        {open && (
          <span className="text-sm font-medium text-muted-foreground transition-opacity duration-200">
            Ocultar
          </span>
        )}
      </div>
    </button>
  );
}
