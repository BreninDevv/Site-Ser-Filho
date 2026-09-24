"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  GradientMenu,
  type GradientMenuItem,
} from "@/components/ui/gradient-menu";
import {
  itemPainelGradient,
  itemUnicasGradient,
  siteGradientNavItems,
} from "@/components/site-header";
import { logout } from "@/app/(auth)/login/actions";

export function PublicMobileMenu({
  hrefPainel,
  userLabel,
  logado,
  mostrarUnicas = false,
}: {
  hrefPainel?: string | null;
  userLabel?: string | null;
  logado: boolean;
  mostrarUnicas?: boolean;
}) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    setAberto(false);
  }, [pathname]);

  const items: GradientMenuItem[] = [
    ...siteGradientNavItems,
    ...(mostrarUnicas ? [itemUnicasGradient] : []),
    ...(hrefPainel ? [itemPainelGradient(hrefPainel)] : []),
  ];

  return (
    <div className="ml-auto md:hidden">
      <Sheet open={aberto} onOpenChange={setAberto}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Abrir menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[min(20rem,92vw)]">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-5 px-4 pb-6">
            <GradientMenu
              items={items}
              orientation="vertical"
              variant="site"
              activeGradient
              compact
              instantNav
              onNavigate={() => setAberto(false)}
              className="w-full items-stretch gap-3"
            />

            <div className="flex flex-col gap-3">
              {logado ? (
                <>
                  {userLabel ? (
                    <Link
                      href="/perfil"
                      onClick={() => setAberto(false)}
                      className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      {userLabel}
                    </Link>
                  ) : null}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full rounded-full"
                    asChild
                  >
                    <Link href="/perfil" onClick={() => setAberto(false)}>
                      Meu perfil
                    </Link>
                  </Button>
                  <form action={logout}>
                    <Button
                      size="sm"
                      variant="outline"
                      type="submit"
                      className="w-full rounded-full"
                    >
                      Sair
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full rounded-full"
                    asChild
                  >
                    <Link href="/login" onClick={() => setAberto(false)}>
                      Entrar
                    </Link>
                  </Button>
                  <Button size="sm" className="w-full rounded-full" asChild>
                    <Link href="/cadastro" onClick={() => setAberto(false)}>
                      Cadastrar
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
