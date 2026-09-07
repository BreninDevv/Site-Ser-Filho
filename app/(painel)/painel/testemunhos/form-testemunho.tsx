"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MAX_DESCRICAO_TESTEMUNHO } from "@/lib/midia";
import { criarTestemunho } from "./actions";

const campo =
  "w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground";

export function FormTestemunho() {
  const [estado, action, pendente] = useActionState(
    async (_prev: { erro?: string; ok?: boolean } | null, formData: FormData) => {
      return criarTestemunho(formData);
    },
    null
  );
  const [tipoPrevia, setTipoPrevia] = useState<"image" | "video" | null>(null);
  const [urlPrevia, setUrlPrevia] = useState("");

  useEffect(() => {
    return () => {
      if (urlPrevia) URL.revokeObjectURL(urlPrevia);
    };
  }, [urlPrevia]);

  function aoEscolherPrevia(arquivo: File | undefined) {
    if (urlPrevia) URL.revokeObjectURL(urlPrevia);
    if (!arquivo) {
      setTipoPrevia(null);
      setUrlPrevia("");
      return;
    }
    setTipoPrevia(arquivo.type.startsWith("video/") ? "video" : "image");
    setUrlPrevia(URL.createObjectURL(arquivo));
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div>
        <label htmlFor="nome" className="mb-1.5 block text-sm font-medium">
          Nome / título
        </label>
        <input
          id="nome"
          name="nome"
          required
          disabled={pendente}
          placeholder="Quem está testemunhando"
          className={campo}
        />
      </div>
      <div>
        <label htmlFor="descricao" className="mb-1.5 block text-sm font-medium">
          Descrição
        </label>
        <textarea
          id="descricao"
          name="descricao"
          required
          rows={4}
          maxLength={MAX_DESCRICAO_TESTEMUNHO}
          disabled={pendente}
          placeholder="Uma frase do testemunho, como no Reel..."
          className={campo}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Até {MAX_DESCRICAO_TESTEMUNHO} caracteres. Aparece embaixo do Reel na
          home.
        </p>
      </div>
      <div>
        <label htmlFor="video_url" className="mb-1.5 block text-sm font-medium">
          Link do Instagram ou YouTube
        </label>
        <input
          id="video_url"
          name="video_url"
          type="url"
          required
          disabled={pendente}
          placeholder="https://www.instagram.com/reel/... ou https://youtu.be/..."
          className={campo}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Quem clicar no Reel da home vai para esse link.
        </p>
      </div>
      <div>
        <label htmlFor="previa" className="mb-1.5 block text-sm font-medium">
          Prévia do Reel
        </label>
        <input
          id="previa"
          name="previa"
          type="file"
          required
          disabled={pendente}
          accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
          onChange={(e) => aoEscolherPrevia(e.target.files?.[0])}
          className={campo}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Foto ou vídeo curto, na vertical. PNG, JPG, WebP, MP4 ou WebM. Até 12
          MB.
        </p>
        {urlPrevia && (
          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-black">
            {tipoPrevia === "video" ? (
              <video
                src={urlPrevia}
                muted
                loop
                autoPlay
                playsInline
                className="mx-auto aspect-[9/16] max-h-72 w-auto object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={urlPrevia}
                alt=""
                className="mx-auto aspect-[9/16] max-h-72 w-auto object-cover"
              />
            )}
          </div>
        )}
      </div>
      {estado?.erro && <p className="text-sm text-destructive">{estado.erro}</p>}
      <Button type="submit" disabled={pendente} className="rounded-full">
        {pendente ? "Publicando..." : "Publicar testemunho"}
      </Button>
    </form>
  );
}
