/**
 * Shell antigo do auth (painel marca + formulário) — usado em cadastro / esqueci-senha.
 * O login usa o visual Login10 em tela cheia.
 */
export function AuthBrandShell({ children }: { children: React.ReactNode }) {
  const degradêTopo = {
    background:
      "linear-gradient(to bottom, rgba(255,255,255,0.88) 0%, rgba(180,200,220,0.45) 38%, rgba(20,20,18,0) 100%)",
  };

  return (
    <div className="flex min-h-svh min-w-0 overflow-x-clip">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-foreground p-12 text-background lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
          style={degradêTopo}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-background/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-background/10"
        />

        <div className="relative inline-flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-ser-filho.png"
            alt="Ser Filho"
            width={140}
            height={140}
            className="h-12 w-auto"
          />
        </div>

        <div className="relative max-w-sm">
          <h1 className="font-heading text-6xl uppercase leading-[0.9]">
            Ser Filho
          </h1>
          <p className="mt-6 text-sm leading-relaxed text-background/70">
            Um lugar para a comunidade: discípulo, líder, pastor e equipe no
            mesmo site — células, testemunhos e o Encontro De Volta ao Jardim.
          </p>
        </div>

        <p className="relative text-xs text-background/50">
          Entre ou cadastre-se para acessar o site.
        </p>
      </div>

      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden bg-foreground px-4 py-12 text-background lg:w-1/2 lg:bg-background lg:text-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[70%] lg:hidden"
          style={degradêTopo}
        />
        <div className="relative mb-8 flex items-center lg:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-ser-filho.png"
            alt="Ser Filho"
            width={140}
            height={140}
            className="h-12 w-auto"
          />
        </div>
        <div className="auth-form-panel relative w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
