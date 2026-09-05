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
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-foreground" />
          <span className="font-heading text-lg tracking-wide">SER FILHO</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-1">
          {publicLinks.map((link) => (
            <Button key={link.href} variant="ghost" size="sm" className="text-sm font-semibold" asChild>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}

          {perfil?.role === "dev" && (
            <Button size="sm" variant="ghost" className="text-sm font-semibold" asChild>
              <Link href="/painel">Painel</Link>
            </Button>
          )}

          {user ? (
            <div className="flex items-center gap-3 pl-2 text-sm">
              <span className="text-muted-foreground">
                Olá, <strong className="text-foreground">{perfil?.nome ?? user.email}</strong>
                {perfil?.role && perfil.role !== "pendente" && ` (${rotulosRole[perfil.role] ?? perfil.role})`}
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
      </div>
    </header>
  );
}