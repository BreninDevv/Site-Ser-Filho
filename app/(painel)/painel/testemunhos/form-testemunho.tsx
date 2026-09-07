"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { criarTestemunho } from "./actions";

export function FormTestemunho() {
  const [estado, action, pendente] = useActionState(
    async (_prev: { erro?: string; ok?: boolean } | null, formData: FormData) => {
      return criarTestemunho(formData);
    },
    null
  );

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div>
        <label htmlFor="nome" className="mb-1.5 block text-sm font-medium">
          Nome
        </label>
        <input
          id="nome"
          name="nome"
          required
          disabled={pendente}
          placeholder="Quem está testemunhando"
          className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
        />
      </div>
      <div>
        <label htmlFor="video_url" className="mb-1.5 block text-sm font-medium">
          Link do vídeo
        </label>
        <input
          id="video_url"
          name="video_url"
          type="url"
          required
          disabled={pendente}
          placeholder="https://www.instagram.com/reel/..."
          className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Cole o link do Reels ou do YouTube Shorts. O vídeo toca no site.
        </p>
      </div>
      {estado?.erro && <p className="text-sm text-destructive">{estado.erro}</p>}
      <Button type="submit" disabled={pendente} className="rounded-full">
        {pendente ? "Publicando..." : "Publicar testemunho"}
      </Button>
    </form>
  );
}
