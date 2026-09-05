import Link from "next/link";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/login/actions";

const publicLinks = [
  { href: "/", label: "Início" },
  { href: "/celulas", label: "Células" },
  { href: "/testemunhos", label: "Testemunhos" },
  { href: "/encontro-com-deus", label: "Encontro com Deus" },
];

const rotulosRole: Record<string, string> = {
  dev: "Dev",
  lider: "Líder/Pastor",
  pendente: "Aguardando aprovação",
};

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

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-foreground" />
          <span className="font-heading text-lg tracking-wide">
            SER FILHO
          </span>
        </Link>

        {/* MENU DESKTOP */}
        <nav className="hidden items-center gap-1 md:flex">
          {publicLinks.map((link) => (
            <Button
              key={link.href}
              variant="ghost"
              size="sm"
              className="text-sm font-semibold"
              asChild
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}

          {perfil?.role === "dev" && (
            <Button
              size="sm"
              variant="ghost"
              className="text-sm font-semibold"
              asChild
            >
              <Link href="/painel">Painel</Link>
            </Button>
          )}

          {user ? (
            <div className="flex items-center gap-3 pl-2 text-sm">
              <span className="text-muted-foreground">
                Olá,{" "}
                <strong className="text-foreground">
                  {perfil?.nome ?? user.email}
                </strong>

                {perfil?.role &&
                  perfil.role !== "pendente" &&
                  ` (${rotulosRole[perfil.role] ?? perfil.role})`}
              </span>

              <form action={logout}>
                <Button size="sm" variant="outline" type="submit">
                  Sair
                </Button>
              </form>
            </div>
          ) : (
            <>
              <Button size="sm" variant="outline" asChild>
                <Link href="/login">Entrar</Link>
              </Button>

              <Button
                size="sm"
                className="bg-foreground text-background hover:bg-foreground/90"
                asChild
              >
                <Link href="/cadastro">Cadastrar</Link>
              </Button>
            </>
          )}
        </nav>

        {/* MENU MOBILE */}
        <details className="relative md:hidden">
          <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-md border border-border text-xl">
            ☰
          </summary>

          <div className="absolute right-0 top-12 z-30 w-64 rounded-lg border border-border bg-background p-3 shadow-lg">
            {/* LINKS */}
            <nav className="flex flex-col gap-1">
              {publicLinks.map((link) => (
                <Button
                  key={link.href}
                  variant="ghost"
                  className="justify-start text-sm font-semibold"
                  asChild
                >
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))}

              {perfil?.role === "dev" && (
                <Button
                  variant="ghost"
                  className="justify-start text-sm font-semibold"
                  asChild
                >
                  <Link href="/painel">Painel</Link>
                </Button>
              )}
            </nav>

            {/* SEPARADOR */}
            <div className="my-3 border-t border-border" />

            {/* USUÁRIO */}
            {user ? (
              <div className="flex flex-col gap-3">
                <span className="px-2 text-sm text-muted-foreground">
                  Olá,{" "}
                  <strong className="text-foreground">
                    {perfil?.nome ?? user.email}
                  </strong>

                  {perfil?.role &&
                    perfil.role !== "pendente" &&
                    ` (${rotulosRole[perfil.role] ?? perfil.role})`}
                </span>

                <form action={logout}>
                  <Button
                    size="sm"
                    variant="outline"
                    type="submit"
                    className="w-full"
                  >
                    Sair
                  </Button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link href="/login">Entrar</Link>
                </Button>

                <Button
                  size="sm"
                  className="bg-foreground text-background hover:bg-foreground/90"
                  asChild
                >
                  <Link href="/cadastro">Cadastrar</Link>
                </Button>
              </div>
            )}
          </div>
        </details>
      </div>
    </header>
  );
}