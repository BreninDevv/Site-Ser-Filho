import Link from "next/link";
import { Button } from "@/components/ui/button";

const painelLinks = [
  { href: "/painel", label: "Dashboard" },
  { href: "/painel/encontro", label: "Inscrições do Encontro" },
  { href: "/painel/admin/usuarios", label: "Admin · Usuários" },
];

export function PainelNav() {
  return (
    <aside className="w-full border-b bg-sidebar md:w-56 md:border-b-0 md:border-r">
      <div className="flex flex-col gap-1 p-3">
        <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
          Painel (dev)
        </p>
        {painelLinks.map((link) => (
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
          <Link href="/">Voltar ao site</Link>
        </Button>
      </div>
    </aside>
  );
}