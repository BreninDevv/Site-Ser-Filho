"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { atualizarChavePixAction } from "@/app/(painel)/painel/chave-pix/actions";

export function ChavePixPainel({ chaveAtual }: { chaveAtual: string }) {
  const [pending, startTransition] = useTransition();
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [chave, setChave] = useState(chaveAtual);

  return (
    <section className="rounded-lg border border-border bg-background p-4">
      <h2 className="text-sm font-medium">Chave Pix da igreja</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Aparece nas inscrições de De Volta ao Jardim, Legado e eventos quando a
        pessoa escolher Pix. Só Tesouraria, Líder/Tesouraria, Apóstolo(a) e Dev
        alteram.
      </p>
      <form
        className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          setErro(null);
          setMensagem(null);
          startTransition(async () => {
            const resultado = await atualizarChavePixAction(data);
            if (!resultado.ok) {
              setErro(resultado.mensagem);
              return;
            }
            setChave(resultado.chave);
            setMensagem("Chave Pix salva.");
          });
        }}
      >
        <label className="grid flex-1 gap-1 text-sm">
          <span className="text-muted-foreground">Chave</span>
          <input
            name="chave_pix"
            value={chave}
            onChange={(e) => setChave(e.target.value)}
            required
            minLength={5}
            maxLength={200}
            className="border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-foreground"
            disabled={pending}
          />
        </label>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Salvando…" : "Salvar chave"}
        </Button>
      </form>
      {erro ? <p className="mt-2 text-sm text-destructive">{erro}</p> : null}
      {mensagem ? (
        <p className="mt-2 text-sm text-muted-foreground">{mensagem}</p>
      ) : null}
    </section>
  );
}
