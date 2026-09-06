import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/server";
import { destinoDoPainel, ROTULOS_ROLE } from "@/lib/auth/roles";
import { logout } from "@/app/(auth)/login/actions";

const publicLinks = [
  { href: "/inicio", label: "Início" },
  { href: "/celulas", label: "Células" },
  { href: "/testemunhos", label: "Testemunhos" },
  { href: "/encontro-com-deus", label: "Encontro com Deus" },
];

export async function PublicHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let perfil: { nome: string; role: string } | null = null;
  if (user) {
    const { data } = await supabase
      .from("perfis")
      .select("nome, role")
      .eq("id", user.id)
      .single();
    perfil = data;
  }

  const hrefPainel = destinoDoPainel(perfil?.role);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4">
        <Link href="/inicio" className="flex items-center gap-2.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-foreground" />
          <span className="font-heading text-lg tracking-wide">SER FILHO</span>
        </Link>

        {/* Menu completo — só aparece em telas médias/grandes */}
        <nav className="hidden items-center gap-1 md:flex">
          {publicLinks.map((link) => (
            <Button key={link.href} variant="ghost" size="sm" className="text-sm font-semibold" asChild>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}

          {hrefPainel && (
            <Button size="sm" variant="ghost" className="text-sm font-semibold" asChild>
              <Link href={hrefPainel}>Painel</Link>
            </Button>
          )}

          {user ? (
            <div className="flex items-center gap-3 pl-2 text-sm">
              <span className="text-muted-foreground">
                Olá, <strong className="text-foreground">{perfil?.nome ?? user.email}</strong>
                {perfil?.role && perfil.role !== "pendente" && ` (${ROTULOS_ROLE[perfil.role] ?? perfil.role})`}
              </span>
              <form action={logout}>
                <Button size="sm" variant="outline" type="submit">Sair</Button>
              </form>
            </div>
          ) : (
            <>
              <Button size="sm" variant="outline" asChild>
                <Link href="/login">Entrar</Link>
              </Button>
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90" asChild>
                <Link href="/cadastro">Cadastrar</Link>
              </Button>
            </>
          )}
        </nav>

        {/* Botão de menu — só aparece em telas pequenas */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle className="font-heading text-lg tracking-wide">SER FILHO</SheetTitle>
            </SheetHeader>

            <div className="flex flex-col gap-1 px-4">
              {publicLinks.map((link) => (
                <SheetClose asChild key={link.href}>
                  <Link
                    href={link.href}
                    className="rounded-none border-b border-border py-3 text-sm font-semibold"
                  >
                    {link.label}
                  </Link>
                </SheetClose>
              ))}

              {hrefPainel && (
                <SheetClose asChild>
                  <Link href={hrefPainel} className="border-b border-border py-3 text-sm font-semibold">
                    Painel
                  </Link>
                </SheetClose>
              )}

              <div className="mt-4 flex flex-col gap-3">
                {user ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Olá, <strong className="text-foreground">{perfil?.nome ?? user.email}</strong>
                      {perfil?.role && perfil.role !== "pendente" && ` (${ROTULOS_ROLE[perfil.role] ?? perfil.role})`}
                    </p>
                    <form action={logout}>
                      <Button size="sm" variant="outline" type="submit" className="w-full">
                        Sair
                      </Button>
                    </form>
                  </>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Button size="sm" variant="outline" className="w-full" asChild>
                        <Link href="/login">Entrar</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button size="sm" className="w-full bg-foreground text-background hover:bg-foreground/90" asChild>
                        <Link href="/cadastro">Cadastrar</Link>
                      </Button>
                    </SheetClose>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}