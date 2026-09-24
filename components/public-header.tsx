import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { destinoDoPainel, ROTULOS_ROLE } from "@/lib/auth/roles";
import { podeAcessarUnicas } from "@/lib/auth/unicas";
import { logout } from "@/app/(auth)/login/actions";
import { PublicMobileMenu } from "@/components/public-mobile-menu";
import { PublicGradientNav } from "@/components/public-gradient-nav";

export async function PublicHeader() {
  let user: { id: string; email?: string } | null = null;
  let perfil: { nome: string; role: string; sexo: string | null } | null =
    null;
  try {
    const supabase = await createClient();
    const {
      data: { user: sessao },
    } = await supabase.auth.getUser();
    user = sessao;
    if (sessao) {
      const { data, error } = await supabase
        .from("perfis")
        .select("nome, role, sexo")
        .eq("id", sessao.id)
        .maybeSingle();

      if (error && /sexo/i.test(error.message ?? "")) {
        // Migration 027 ainda não rodou — não quebrar Painel/nav por causa de sexo.
        const { data: semSexo } = await supabase
          .from("perfis")
          .select("nome, role")
          .eq("id", sessao.id)
          .maybeSingle();
        perfil = semSexo ? { ...semSexo, sexo: null } : null;
      } else {
        perfil = data;
      }
    }
  } catch {
    user = null;
    perfil = null;
  }

  const mostrarUnicas =
    Boolean(user) &&
    podeAcessarUnicas({ role: perfil?.role, sexo: perfil?.sexo });

  const hrefPainel = destinoDoPainel(perfil?.role);

  const userLabel = user
    ? `Olá, ${perfil?.nome ?? user.email}${
        perfil?.role && perfil.role !== "pendente"
          ? ` (${ROTULOS_ROLE[perfil.role] ?? perfil.role})`
          : ""
      }`
    : null;

  return (
    <header className="sticky top-0 z-20 min-w-0 bg-transparent px-3 pt-4 pb-2">
      <div className="relative z-10 mx-auto flex w-full min-w-0 max-w-6xl items-center gap-3 overflow-visible rounded-full border border-white/70 bg-white/70 px-3 py-2.5 shadow-[0_8px_30px_rgba(20,20,18,0.08)] backdrop-blur-xl sm:px-4 md:px-5">
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

        <nav className="relative z-10 mx-auto hidden min-w-0 flex-1 items-center justify-center overflow-visible md:flex">
          <PublicGradientNav
            hrefPainel={hrefPainel}
            mostrarUnicas={mostrarUnicas}
          />
        </nav>

        <div className="relative z-10 ml-auto hidden shrink-0 items-center gap-2 md:flex">
          {user ? (
            <div className="flex items-center gap-3 text-sm">
              <Link
                href="/perfil"
                className="max-w-36 truncate text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                title="Editar perfil"
              >
                Olá,{" "}
                <strong className="text-foreground">
                  {perfil?.nome ?? user.email}
                </strong>
                {perfil?.role &&
                  perfil.role !== "pendente" &&
                  ` (${ROTULOS_ROLE[perfil.role] ?? perfil.role})`}
              </Link>
              <form action={logout}>
                <Button
                  size="sm"
                  variant="outline"
                  type="submit"
                  className="rounded-full"
                >
                  Sair
                </Button>
              </form>
            </div>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                asChild
              >
                <Link href="/login">Entrar</Link>
              </Button>
              <Button size="sm" className="rounded-full px-4" asChild>
                <Link href="/cadastro">Cadastrar</Link>
              </Button>
            </>
          )}
        </div>

        <PublicMobileMenu
          hrefPainel={hrefPainel}
          logado={Boolean(user)}
          userLabel={userLabel}
          mostrarUnicas={mostrarUnicas}
        />
      </div>
    </header>
  );
}
