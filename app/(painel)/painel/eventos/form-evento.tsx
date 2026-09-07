"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { criarEvento } from "./actions";

export function FormEvento() {
  const [estado, action, pendente] = useActionState(
    async (_prev: { erro?: string; ok?: boolean } | null, formData: FormData) => {
      return criarEvento(formData);
    },
    null
  );

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div>
        <label htmlFor="nome" className="mb-1.5 block text-sm font-medium">
          Nome do evento
        </label>
        <input
          id="nome"
          name="nome"
          required
          disabled={pendente}
          placeholder="Culto de jovens, conferência..."
          className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
        />
      </div>
      <div>
        <label htmlFor="imagem" className="mb-1.5 block text-sm font-medium">
          Imagem do post
        </label>
        <input
          id="imagem"
          name="imagem"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          required
          disabled={pendente}
          className="w-full border border-border bg-background px-3 py-2.5 text-sm file:mr-3 file:border-0 file:bg-foreground file:px-3 file:py-1.5 file:text-sm file:text-background"
        />
        <p className="mt-1 text-xs text-muted-foreground">PNG, JPG ou WebP, até 5 MB.</p>
      </div>
      {estado?.erro && <p className="text-sm text-destructive">{estado.erro}</p>}
      <Button type="submit" disabled={pendente} className="rounded-full">
        {pendente ? "Publicando..." : "Publicar evento"}
      </Button>
    </form>
  );
}
