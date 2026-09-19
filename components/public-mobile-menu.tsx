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
  siteGradientNavItems,
} from "@/components/site-header";
import { logout } from "@/app/(auth)/login/actions";

export function PublicMobileMenu({
  hrefPainel,
  userLabel,
  logado,
}: {
  hrefPainel?: string | null;
  userLabel?: string | null;
  logado: boolean;
}) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    setAberto(false);
  }, [pathname]);

  const items: GradientMenuItem[] = [
    ...siteGradientNavItems,
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
              className="items-stretch gap-3"
            />

            <div className="flex flex-col gap-3">
              {logado ? (
                <>
                  {userLabel ? (
                    <p className="text-sm text-muted-foreground">{userLabel}</p>
                  ) : null}
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
