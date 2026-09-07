import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Typewriter } from "@/components/typewriter";
import { createClient } from "@/lib/supabase/server";
import { TestemunhosHome } from "@/components/testemunhos-home";
import { embedDoVideo, INSTAGRAM_SER_FILHO, urlPublicaDoPost } from "@/lib/midia";

export default async function InicioPage() {
  const supabase = await createClient();

  const { data: celulas } = await supabase
    .from("celulas")
    .select("id, nome, dia, horario, foto_url")
    .order("created_at", { ascending: false })
    .limit(3);

  const { data: eventos } = await supabase
    .from("eventos")
    .select("id, nome, imagem_path")
    .order("created_at", { ascending: false })
    .limit(3);

  const { data: testemunhos } = await supabase
    .from("testemunhos")
    .select("nome, video_url")
    .order("created_at", { ascending: false })
    .limit(3);

  const testemunhosHome = (testemunhos ?? [])
    .map((item) => {
      const embed = embedDoVideo(item.video_url);
      if (!embed) return null;
      return { nome: item.nome, embed };
    })
    .filter((item): item is { nome: string; embed: string } => Boolean(item));

  return (
    <div>
      <section className="relative flex min-h-[calc(100svh-7.5rem)] items-center justify-center overflow-hidden px-4 py-16 text-center -mt-12 sm:-mt-16">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-tertiary/10 blur-3xl"
        />
        <div className="relative mx-auto max-w-2xl">
          <img
            src="/logo-yenps-transparente.png"
            alt="YENPS"
            width={80}
            height={80}
            className="mx-auto mb-3 h-16 w-16 bg-transparent object-contain"
          />
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-tertiary">
            Ministério
          </p>
          <h1 className="font-heading text-6xl font-bold leading-[0.95] tracking-tight sm:text-7xl">
            Ser Filho
          </h1>
          <p className="mx-auto mt-7 max-w-md text-lg leading-relaxed text-muted-foreground">
            Um lugar para{" "}
            <Typewriter
              palavras={["pertencer.", "crescer.", "ser chamado filho."]}
            />
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" className="h-11 rounded-full px-7" asChild>
              <Link href="/encontro-com-deus">Conheça o Volta ao Jardim</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-11 rounded-full px-7" asChild>
              <Link href="/celulas">Ver células</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="px-4 py-24">
        <div className="mx-auto grid max-w-4xl items-center gap-12 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Sobre nós
            </p>
            <h2 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
              Uma comunidade para a vida real
            </h2>
          </div>
          <div>
            <p className="text-xl leading-relaxed">
              Somos uma comunidade que caminha junto — não um prédio, um evento
              ou um domingo isolado.
            </p>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              A visão Yenps nasceu do desejo de formar pessoas que conhecem sua
              identidade e vivem isso todos os dias, dentro e fora da igreja.
              Célula por célula, vida por vida.
            </p>
          </div>
        </div>
        <div className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-3">
          <div className="rounded-2xl bg-secondary p-6">
            <p className="font-heading text-3xl font-bold">Células</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Grupos pequenos pela cidade, toda semana.
            </p>
          </div>
          <div className="rounded-2xl bg-secondary p-6">
            <p className="font-heading text-3xl font-bold">Encontro</p>
            <p className="mt-2 text-sm text-muted-foreground">
              O Volta ao Jardim, para começar de novo.
            </p>
          </div>
          <div className="rounded-2xl bg-secondary p-6">
            <p className="font-heading text-3xl font-bold">Legado</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Continuidade: firmar o que Deus já começou.
            </p>
          </div>
        </div>
      </section>

      <section
        id="testemunhos"
        className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 bg-tertiary px-4 py-24 text-white"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                Histórias
              </p>
              <h2 className="font-heading text-4xl font-bold tracking-tight">
                Testemunhos
              </h2>
            </div>
            <p className="max-w-sm text-sm text-white/75">
              Histórias reais de pessoas que encontraram algo novo dentro do Ser
              Filho.
            </p>
          </div>
          <TestemunhosHome itens={testemunhosHome} />
          <div className="mt-10">
            <Button
              variant="outline"
              className="rounded-full border-white/40 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <a
                href={INSTAGRAM_SER_FILHO}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver mais testemunhos
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="px-4 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Comunidade
              </p>
              <h2 className="font-heading text-4xl font-bold tracking-tight">
                Células
              </h2>
            </div>
            <p className="max-w-sm text-sm text-muted-foreground">
              Grupos pequenos espalhados pela cidade, abertos toda semana para
              quem quiser chegar perto.
            </p>
          </div>

          {!celulas || celulas.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Nenhuma célula cadastrada ainda.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-3">
              {celulas.map((c) => (
                <div
                  key={c.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-[0_1rem_2.5rem_rgba(29,30,41,0.08)]"
                >
                  <div className="flex aspect-video w-full items-center justify-center bg-muted">
                    {c.foto_url ? (
                      <img
                        src={c.foto_url}
                        alt={c.nome}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        className="h-7 w-7 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="1" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    )}
                  </div>
                  <div className="p-5">
                    <span className="block text-base font-bold">{c.nome}</span>
                    <span className="text-sm text-muted-foreground">
                      {c.dia} · {c.horario}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-10">
            <Button size="lg" className="h-12 rounded-full px-8" asChild>
              <Link href="/celulas">Ver todas as células</Link>
            </Button>
          </div>
        </div>
      </section>

      {eventos && eventos.length > 0 && (
        <section className="px-4 py-24">
          <div className="mx-auto max-w-4xl">
            <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Agenda
                </p>
                <h2 className="font-heading text-4xl font-bold tracking-tight">
                  Eventos
                </h2>
              </div>
              <p className="max-w-sm text-sm text-muted-foreground">
                O que está acontecendo agora no Ser Filho.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {eventos.map((evento) => (
                <Link
                  key={evento.id}
                  href="/eventos"
                  className="overflow-hidden rounded-2xl bg-white shadow-[0_1rem_2.5rem_rgba(20,20,18,0.08)]"
                >
                  <img
                    src={urlPublicaDoPost(evento.imagem_path)}
                    alt={evento.nome}
                    className="aspect-[4/5] w-full object-cover"
                  />
                  <div className="p-5">
                    <span className="block text-base font-bold">{evento.nome}</span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-10">
              <Button size="lg" variant="outline" className="h-12 rounded-full px-8" asChild>
                <Link href="/eventos">Ver todos os eventos</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      <section className="relative overflow-hidden bg-[#1f3d1f] px-4 py-32 text-center text-[#faf9f6]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-35"
          style={{ backgroundImage: "url('/encontro/fundo.jpg')" }}
        />
        <div className="relative">
          <p className="mb-5 text-sm font-semibold tracking-wide text-[#faf9f6]/60">
            O evento principal
          </p>
          <h2 className="font-heading text-6xl font-bold leading-[0.95] sm:text-7xl">
            Volta ao
            <br />
            Jardim
          </h2>
          <p className="mx-auto mt-7 max-w-sm text-[#faf9f6]/70">
            Um fim de semana para encontrar quem você é. Vagas abertas para a
            próxima turma.
          </p>
          <Button
            size="lg"
            className="mt-9 h-12 rounded-full bg-[#faf9f6] px-8 text-[#1f3d1f] hover:bg-[#faf9f6]/90"
            asChild
          >
            <Link href="/encontro-com-deus">Fazer minha inscrição</Link>
          </Button>
        </div>
      </section>

      <section className="relative overflow-hidden bg-black px-4 py-32 text-center text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-80"
          style={{ backgroundImage: "url('/legado/fundo.jpg')" }}
        />
        <div className="relative">
          <p className="mb-5 text-sm font-semibold tracking-wide text-white/50">
            Continuidade
          </p>
          <h2 className="font-heading text-6xl font-bold leading-[0.95] text-[#c6ff00] sm:text-7xl">
            Legado
            <br />
            de Cristo
          </h2>
          <p className="mx-auto mt-7 max-w-sm text-white/65">
            Um tempo para firmar o que Deus já começou e deixar um rastro de fé.
          </p>
          <Button
            size="lg"
            className="mt-9 h-12 rounded-full bg-[#c6ff00] px-8 text-black hover:bg-[#b3e600]"
            asChild
          >
            <Link href="/legado-de-cristo">Inscrever no Legado</Link>
          </Button>
        </div>
      </section>

      <section className="px-4 py-24">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Contato
          </p>
          <h2 className="font-heading mb-2 text-4xl font-bold tracking-tight">
            Fale conosco
          </h2>
          <p className="mb-10 text-sm text-muted-foreground">
            Ficou com alguma dúvida? Esses são os canais para chegar até a gente.
          </p>
          <div className="overflow-hidden rounded-2xl bg-secondary">
            <div className="flex items-center justify-between px-6 py-5">
              <span className="font-semibold">WhatsApp</span>
              <span className="text-sm italic text-muted-foreground">
                [a preencher]
              </span>
            </div>
            <div className="flex items-center justify-between px-6 py-5">
              <span className="font-semibold">E-mail</span>
              <span className="text-sm italic text-muted-foreground">
                [a preencher]
              </span>
            </div>
            <div className="flex items-center justify-between px-6 py-5">
              <span className="font-semibold">Endereço</span>
              <span className="text-sm italic text-muted-foreground">
                [a preencher]
              </span>
            </div>
          </div>
        </div>
      </section>

      <p className="px-4 pb-14 pt-2 text-center font-heading text-lg font-medium tracking-wide text-foreground/70 sm:text-xl">
        O Ministério Ser Filho ama cada um de vocês!
      </p>
    </div>
  );
}
