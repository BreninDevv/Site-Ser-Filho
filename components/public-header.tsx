import Image from "next/image";
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
import { SlideTabs } from "@/components/ui/slide-tabs";

const publicLinks = [
  { href: "/inicio", label: "Início" },
  { href: "/celulas", label: "Células" },
  { href: "/eventos", label: "Eventos" },
  { href: "/inicio#testemunhos", label: "Testemunhos" },
  { href: "/encontro-com-deus", label: "Volta ao Jardim" },
  { href: "/legado-de-cristo", label: "Legado de Cristo" },
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
    <header className="sticky top-0 z-20 bg-transparent px-3 pt-4 pb-2">
      <div className="relative mx-auto flex max-w-5xl items-center rounded-full border border-white/70 bg-white/70 px-4 py-2 shadow-[0_8px_30px_rgba(20,20,18,0.08)] backdrop-blur-xl md:px-5">
        <Link href="/inicio" className="relative z-10 flex shrink-0 items-center">
          <Image
            src="/logo-ser-filho.png"
            alt="Ser Filho"
            width={140}
            height={140}
            className="h-9 w-auto"
            priority
          />
        </Link>

        <nav className="pointer-events-none absolute inset-0 hidden items-center justify-center md:flex">
          <div className="pointer-events-auto">
            <SlideTabs
              compact
              items={[
                ...publicLinks,
                ...(hrefPainel ? [{ href: hrefPainel, label: "Painel" }] : []),
              ]}
            />
          </div>
        </nav>

        <div className="relative z-10 ml-auto hidden items-center gap-2 md:flex">
          {user ? (
            <div className="flex items-center gap-3 text-sm">
              <span className="max-w-36 truncate text-muted-foreground">
                Olá, <strong className="text-foreground">{perfil?.nome ?? user.email}</strong>
                {perfil?.role && perfil.role !== "pendente" && ` (${ROTULOS_ROLE[perfil.role] ?? perfil.role})`}
              </span>
              <form action={logout}>
                <Button size="sm" variant="outline" type="submit" className="rounded-full">Sair</Button>
              </form>
            </div>
          ) : (
            <>
              <Button size="sm" variant="outline" className="rounded-full" asChild>
                <Link href="/login">Entrar</Link>
              </Button>
              <Button size="sm" className="rounded-full px-4" asChild>
                <Link href="/cadastro">Cadastrar</Link>
              </Button>
            </>
          )}
        </div>

        {/* Botão de menu — só no celular */}
        <div className="ml-auto md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
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
                      <Button size="sm" className="w-full rounded-full" asChild>
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
      </div>
    </header>
  );
}