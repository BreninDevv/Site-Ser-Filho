import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: celulas } = await supabase
    .from("celulas")
    .select("id, nome, dia, horario, foto_url")
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden px-4 py-28 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-[46%] rounded-full border border-border"
        />
        <div className="relative">
          <p className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground">
            Ministério
          </p>
          <h1 className="font-heading text-7xl uppercase leading-[0.9] sm:text-8xl">
            Ser Filho
          </h1>
          <p className="mx-auto mt-8 max-w-md text-lg leading-relaxed text-muted-foreground">
            Um lugar para pertencer, crescer e descobrir o que significa ser chamado filho. Células, testemunhos e um encontro que muda tudo.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90" asChild>
              <Link href="/encontro-com-deus">Conheça o Encontro com Deus</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/celulas">Ver células</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section className="border-y border-border px-4 py-24">
        <div className="mx-auto grid max-w-3xl gap-10 sm:grid-cols-[0.7fr_1.3fr]">
          <span className="font-heading text-7xl text-border">01</span>
          <div>
            <p className="text-xl leading-relaxed">
              Somos uma comunidade que caminha junto — não um prédio, um evento ou um domingo isolado.
            </p>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              A visão Yenps nasceu do desejo de formar pessoas que conhecem sua identidade e vivem isso todos os dias, dentro e fora da igreja. Célula por célula, vida por vida.
            </p>
          </div>
        </div>
      </section>

      {/* TESTEMUNHOS */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="font-heading text-4xl uppercase">Testemunhos</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Histórias reais de pessoas que encontraram algo novo dentro do Ser Filho.
            </p>
          </div>
          <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-3">
            {testemunhosExemplo.map((t) => (
              <div key={t.nome} className="flex flex-col gap-4 bg-background p-6">
                <div className="flex aspect-[4/5] items-center justify-center bg-foreground">
                  <svg viewBox="0 0 24 24" className="h-8 w-8 fill-background">
                    <polygon points="6,4 20,12 6,20" />
                  </svg>
                </div>
                <p className="text-sm leading-relaxed">{t.frase}</p>
                <p className="text-xs font-bold text-muted-foreground">{t.nome}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Button variant="outline" asChild>
              <Link href="/testemunhos">Ver mais testemunhos</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CÉLULAS */}
      <section className="border-t border-border px-4 py-24">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="font-heading text-4xl uppercase">Células</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Grupos pequenos espalhados pela cidade, abertos toda semana para quem quiser chegar perto.
            </p>
          </div>

          {!celulas || celulas.length === 0 ? (
            <p className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Nenhuma célula cadastrada ainda.
            </p>
          ) : (
            <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-3">
              {celulas.map((c) => (
                <div key={c.id} className="flex flex-col bg-background">
                  <div className="aspect-video w-full bg-muted flex items-center justify-center">
                    {c.foto_url ? (
                      <img src={c.foto_url} alt={c.nome} className="h-full w-full object-cover" />
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-7 w-7 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.5">
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

          <div className="mt-8">
            <Button className="bg-foreground text-background hover:bg-foreground/90" asChild>
              <Link href="/celulas">Ver todas as células</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ENCONTRO COM DEUS */}
      <section className="relative overflow-hidden bg-foreground px-4 py-32 text-center text-background">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-background/10"
        />
        <div className="relative">
          <p className="mb-5 text-sm font-semibold tracking-wide text-background/60">
            O evento principal
          </p>
          <h2 className="font-heading text-6xl uppercase leading-[0.9] sm:text-7xl">
            Encontro
            <br />
            com Deus
          </h2>
          <p className="mx-auto mt-7 max-w-sm text-background/70">
            Um fim de semana para encontrar quem você é. Vagas abertas para a próxima turma.
          </p>
          <Button size="lg" className="mt-9 bg-background text-foreground hover:bg-background/90" asChild>
            <Link href="/encontro-com-deus">Fazer minha inscrição</Link>
          </Button>
        </div>
      </section>

      {/* CONTATO */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-heading text-4xl uppercase mb-2">Fale conosco</h2>
          <p className="mb-10 text-sm text-muted-foreground">
            Ficou com alguma dúvida? Esses são os canais para chegar até a gente.
          </p>
          <div className="divide-y divide-border border-t border-border">
            <div className="flex items-center justify-between py-5">
              <span>WhatsApp</span>
              <span className="text-sm italic text-muted-foreground">[a preencher]</span>
            </div>
            <div className="flex items-center justify-between py-5">
              <span>E-mail</span>
              <span className="text-sm italic text-muted-foreground">[a preencher]</span>
            </div>
            <div className="flex items-center justify-between py-5">
              <span>Endereço</span>
              <span className="text-sm italic text-muted-foreground">[a preencher]</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const testemunhosExemplo = [
  {
    nome: "Camila R.",
    frase: "Eu não sabia o que estava procurando até encontrar aqui um lugar que me chamava pelo nome.",
  },
  {
    nome: "Diego M.",
    frase: "A célula virou minha segunda casa. Foi ali que entendi o que era comunidade de verdade.",
  },
  {
    nome: "Larissa T.",
    frase: "O Encontro com Deus mudou a forma como eu enxergo minha própria história.",
  },
];