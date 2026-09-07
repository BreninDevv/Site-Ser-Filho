import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PainelNav({
  titulo,
  mostrarDashboard,
  mostrarEncontro,
  mostrarMidia,
  mostrarAdmin,
}: {
  titulo: string;
  mostrarDashboard: boolean;
  mostrarEncontro: boolean;
  mostrarMidia: boolean;
  mostrarAdmin: boolean;
}) {
  const links = [
    mostrarDashboard && { href: "/painel", label: "Dashboard" },
    mostrarEncontro && { href: "/painel/encontro", label: "Inscrições do Volta ao Jardim" },
    mostrarEncontro && { href: "/painel/legado", label: "Inscrições do Legado" },
    mostrarMidia && { href: "/painel/eventos", label: "Eventos" },
    mostrarMidia && { href: "/painel/testemunhos", label: "Testemunhos" },
    mostrarAdmin && { href: "/painel/admin/usuarios", label: "Admin · Usuários" },
  ].filter((link): link is { href: string; label: string } => Boolean(link));

  return (
    <aside className="w-full border-b bg-sidebar md:w-56 md:border-b-0 md:border-r">
      <div className="flex flex-col gap-1 p-3">
        <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
          {titulo}
        </p>
        {links.map((link) => (
          <Button
            key={link.href}
            variant="ghost"
            size="sm"
            className="justify-start"
            asChild
          >
            <Link href={link.href}>{link.label}</Link>
          </Button>
        ))}
        <Button variant="outline" size="sm" className="mt-2 justify-start" asChild>
          <Link href="/inicio">Voltar ao site</Link>
        </Button>
      </div>
    </aside>
  );
}
