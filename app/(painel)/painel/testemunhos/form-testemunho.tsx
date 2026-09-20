"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MAX_DESCRICAO_TESTEMUNHO } from "@/lib/midia";
import { criarTestemunho } from "./actions";

const campo =
  "w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground";

type PreviaLink = {
  plataforma: "youtube" | "instagram";
  rotulo: string;
  thumbnailUrl: string;
  destino: string;
};

export function FormTestemunho() {
  const [estado, action, pendente] = useActionState(
    async (_prev: { erro?: string; ok?: boolean } | null, formData: FormData) => {
      return criarTestemunho(formData);
    },
    null
  );
  const [tipoPrevia, setTipoPrevia] = useState<"image" | "video" | null>(null);
  const [urlPreviaArquivo, setUrlPreviaArquivo] = useState("");
  const [linkVideo, setLinkVideo] = useState("");
  const [previaLink, setPreviaLink] = useState<PreviaLink | null>(null);
  const [analisando, setAnalisando] = useState(false);
  const [erroLink, setErroLink] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pedidoRef = useRef(0);

  useEffect(() => {
    return () => {
      if (urlPreviaArquivo) URL.revokeObjectURL(urlPreviaArquivo);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [urlPreviaArquivo]);

  function aoEscolherPrevia(arquivo: File | undefined) {
    if (urlPreviaArquivo) URL.revokeObjectURL(urlPreviaArquivo);
    if (!arquivo) {
      setTipoPrevia(null);
      setUrlPreviaArquivo("");
      return;
    }
    setTipoPrevia(arquivo.type.startsWith("video/") ? "video" : "image");
    setUrlPreviaArquivo(URL.createObjectURL(arquivo));
  }

  function analisarLink(url: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const limpo = url.trim();
    setLinkVideo(url);
    setErroLink("");

    if (!limpo) {
      setPreviaLink(null);
      setAnalisando(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const pedido = ++pedidoRef.current;
      setAnalisando(true);
      try {
        const res = await fetch("/api/testemunhos/previa-do-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: limpo }),
        });
        const data = (await res.json()) as PreviaLink & { erro?: string };
        if (pedido !== pedidoRef.current) return;
        if (!res.ok || data.erro) {
          setPreviaLink(null);
          setErroLink(data.erro ?? "Não deu para analisar o link.");
          return;
        }
        setPreviaLink({
          plataforma: data.plataforma,
          rotulo: data.rotulo,
          thumbnailUrl: data.thumbnailUrl,
          destino: data.destino,
        });
        setErroLink("");
      } catch {
        if (pedido !== pedidoRef.current) return;
        setPreviaLink(null);
        setErroLink("Falha ao analisar o link. Tente de novo.");
      } finally {
        if (pedido === pedidoRef.current) setAnalisando(false);
      }
    }, 450);
  }

  const mostrandoArquivo = Boolean(urlPreviaArquivo);
  const mostrandoLink = !mostrandoArquivo && Boolean(previaLink?.thumbnailUrl);

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
          value={linkVideo}
          onChange={(e) => analisarLink(e.target.value)}
          onBlur={(e) => analisarLink(e.target.value)}
          placeholder="https://www.instagram.com/reel/... ou https://youtu.be/..."
          className={campo}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Ao colar o link, o site detecta a plataforma e busca a prévia sozinho.
        </p>
        {analisando ? (
          <p className="mt-2 text-xs text-muted-foreground">Analisando link…</p>
        ) : null}
        {erroLink && !mostrandoArquivo ? (
          <p className="mt-2 text-xs text-destructive">{erroLink}</p>
        ) : null}
        {previaLink && !mostrandoArquivo ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-black">
            <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-white/80">
              <span>
                Prévia automática · <strong>{previaLink.rotulo}</strong>
              </span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previaLink.thumbnailUrl}
              alt=""
              className="mx-auto aspect-[9/16] max-h-72 w-auto object-cover"
            />
          </div>
        ) : null}
      </div>
      <div>
        <label htmlFor="previa" className="mb-1.5 block text-sm font-medium">
          Prévia própria{" "}
          <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <input
          id="previa"
          name="previa"
          type="file"
          disabled={pendente}
          accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
          onChange={(e) => aoEscolherPrevia(e.target.files?.[0])}
          className={campo}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Só se quiser trocar a prévia do link. PNG, JPG, WebP, MP4 ou WebM. Até
          12 MB.
        </p>
        {mostrandoArquivo && (
          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-black">
            {tipoPrevia === "video" ? (
              <video
                src={urlPreviaArquivo}
                muted
                loop
                autoPlay
                playsInline
                className="mx-auto aspect-[9/16] max-h-72 w-auto object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={urlPreviaArquivo}
                alt=""
                className="mx-auto aspect-[9/16] max-h-72 w-auto object-cover"
              />
            )}
          </div>
        )}
        {mostrandoLink && !mostrandoArquivo ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Sem arquivo: vamos usar a prévia do {previaLink?.rotulo}.
          </p>
        ) : null}
      </div>
      {estado?.erro && <p className="text-sm text-destructive">{estado.erro}</p>}
      <Button
        type="submit"
        disabled={pendente || analisando}
        className="rounded-full"
      >
        {pendente ? "Publicando..." : "Publicar testemunho"}
      </Button>
    </form>
  );
}
