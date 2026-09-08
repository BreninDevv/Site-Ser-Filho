export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh min-w-0 overflow-x-clip">
      {/* Painel de marca — some em telas pequenas */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-foreground p-12 text-background lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.92) 0%, rgba(214,230,255,0.55) 42%, rgba(214,230,255,0) 100%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-background/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-background/10"
        />

        <a href="/inicio" className="relative inline-flex items-center">
          <img
            src="/logo-ser-filho.png"
            alt="Ser Filho"
            width={140}
            height={140}
            className="h-12 w-auto"
          />
        </a>

        <div className="relative max-w-sm">
          <h1 className="font-heading text-6xl uppercase leading-[0.9]">
            Ser Filho
          </h1>
          <p className="mt-6 text-sm leading-relaxed text-background/70">
            Um lugar para a comunidade: discípulo, líder, pastor e equipe no
            mesmo site — células, testemunhos e o Encontro de Volta ao Jardim.
          </p>
        </div>

        <p className="relative text-xs text-background/50">
          Visitante navega sem conta. Discípulo se cadastra e fica na base.
        </p>
      </div>

      {/* Painel do formulário */}
      <div className="flex w-full flex-col items-center justify-center px-4 py-12 lg:w-1/2">
        <a href="/inicio" className="mb-8 flex items-center lg:hidden">
          <img
            src="/logo-ser-filho.png"
            alt="Ser Filho"
            width={140}
            height={140}
            className="h-12 w-auto"
          />
        </a>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}