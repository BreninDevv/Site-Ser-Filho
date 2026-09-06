export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh">
      {/* Painel de marca — some em telas pequenas */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-foreground p-12 text-background lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-background/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-background/10"
        />

        <div className="relative flex items-center gap-2.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-background" />
          <span className="text-sm tracking-wide text-background/70">Ministério</span>
        </div>

        <div className="relative max-w-sm">
          <h1 className="font-heading text-6xl uppercase leading-[0.9]">
            Ser Filho
          </h1>
          <p className="mt-6 text-sm leading-relaxed text-background/70">
            Um lugar para líderes e pastores cuidarem das células, dos
            testemunhos e do Encontro com Deus — a comunidade toda num
            só lugar.
          </p>
        </div>

        <p className="relative text-xs text-background/50">
          Visitante não precisa de conta para navegar pelo site.
        </p>
      </div>

      {/* Painel do formulário */}
      <div className="flex w-full flex-col items-center justify-center px-4 py-12 lg:w-1/2">
        <a href="/inicio" className="mb-8 flex items-center gap-2 lg:hidden">
          <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-foreground" />
          <span className="font-heading text-lg tracking-wide">SER FILHO</span>
        </a>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}