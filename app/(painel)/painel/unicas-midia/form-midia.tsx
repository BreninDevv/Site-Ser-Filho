"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { enviarUnicasMidiaNoCliente } from "@/lib/unicas-midia-upload-cliente";
import { criarMidiaUnicas } from "./actions";

const campo =
  "w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground";

export function FormMidiaUnicas() {
  const [estado, action, pendente] = useActionState(
    async (
      _prev: { erro?: string; ok?: boolean } | null,
      formData: FormData
    ) => {
      try {
        const arquivo = formData.get("arquivo");
        if (!(arquivo instanceof File) || arquivo.size === 0) {
          return { erro: "Escolha uma foto ou um vídeo." };
        }
        const up = await enviarUnicasMidiaNoCliente(arquivo);
        if ("erro" in up) return { erro: up.erro };
        formData.set("arquivo_path", up.caminho);
        formData.set("tipo", up.tipo);
        formData.delete("arquivo");
        return await criarMidiaUnicas(formData);
      } catch {
        return {
          erro:
            "Falha ao publicar. Se o arquivo for grande, aguarde o envio e tente de novo.",
        };
      }
    },
    null
  );

  const [tipoPrevia, setTipoPrevia] = useState<"image" | "video" | null>(null);
  const [urlPrevia, setUrlPrevia] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    return () => {
      if (urlPrevia) URL.revokeObjectURL(urlPrevia);
    };
  }, [urlPrevia]);

  useEffect(() => {
    if (!estado?.ok) return;
    formRef.current?.reset();
    setTipoPrevia(null);
    setUrlPrevia((atual) => {
      if (atual) URL.revokeObjectURL(atual);
      return "";
    });
  }, [estado]);

  function aoEscolher(arquivo: File | undefined) {
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
    <form
      ref={formRef}
      action={action}
      className="space-y-4 rounded-2xl border border-border bg-card p-5"
    >
      <div>
        <label htmlFor="titulo" className="mb-1.5 block text-sm font-medium">
          Título
        </label>
        <input
          id="titulo"
          name="titulo"
          required
          disabled={pendente}
          placeholder="Ex.: Culto de abertura"
          className={campo}
        />
      </div>
      <div>
        <label htmlFor="subtitulo" className="mb-1.5 block text-sm font-medium">
          Legenda{" "}
          <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <input
          id="subtitulo"
          name="subtitulo"
          disabled={pendente}
          maxLength={160}
          placeholder="Uma frase curta sob o título"
          className={campo}
        />
      </div>
      <div>
        <label htmlFor="ordem" className="mb-1.5 block text-sm font-medium">
          Ordem
        </label>
        <input
          id="ordem"
          name="ordem"
          type="number"
          min={0}
          max={999}
          defaultValue={0}
          disabled={pendente}
          className={campo}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Menor número aparece primeiro no acordeão.
        </p>
      </div>
      <div>
        <label htmlFor="arquivo" className="mb-1.5 block text-sm font-medium">
          Foto ou vídeo
        </label>
        <input
          id="arquivo"
          name="arquivo"
          type="file"
          required
          disabled={pendente}
          accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
          onChange={(e) => aoEscolher(e.target.files?.[0])}
          className={campo}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          PNG, JPG, WebP, MP4 ou WebM. Até 50 MB.
        </p>
        {urlPrevia ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-black">
            {tipoPrevia === "video" ? (
              <video
                src={urlPrevia}
                muted
                loop
                autoPlay
                playsInline
                className="mx-auto max-h-56 w-auto object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={urlPrevia}
                alt=""
                className="mx-auto max-h-56 w-auto object-cover"
              />
            )}
          </div>
        ) : null}
      </div>
      {estado?.erro ? (
        <p className="text-sm text-destructive">{estado.erro}</p>
      ) : null}
      {estado?.ok ? (
        <p className="text-sm text-emerald-700">Publicado com sucesso.</p>
      ) : null}
      <Button type="submit" disabled={pendente} className="rounded-full">
        {pendente ? "Publicando..." : "Publicar na Únicas"}
      </Button>
    </form>
  );
}
