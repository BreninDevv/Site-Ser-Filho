"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MAX_DESCRICAO_TESTEMUNHO } from "@/lib/midia";
import { enviarPreviaNoCliente } from "@/lib/testemunho-upload-cliente";
import { criarTestemunho } from "./actions";

const campo =
  "w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground";

type PreviaLink = {
  plataforma: "youtube" | "instagram";
  rotulo: string;
  thumbnailUrl: string;
  destino: string;
};

function pareceInstagram(url: string) {
  return /instagram\.com/i.test(url);
}

function pareceYoutubeShorts(url: string) {
  return /youtube\.com\/shorts\//i.test(url);
}

export function FormTestemunho() {
  const [estado, action, pendente] = useActionState(
    async (
      _prev: { erro?: string; ok?: boolean } | null,
      formData: FormData
    ) => {
      try {
        const arquivo = formData.get("previa");
        if (arquivo instanceof File && arquivo.size > 0) {
          const up = await enviarPreviaNoCliente(arquivo);
          if ("erro" in up) return { erro: up.erro };
          formData.set("previa_path", up.caminho);
          formData.delete("previa");
        }
        return await criarTestemunho(formData);
      } catch {
        return {
          erro:
            "Falha ao publicar. Se o vídeo for grande, aguarde o envio e tente de novo.",
        };
      }
    },
    null
  );
  const [tipoPrevia, setTipoPrevia] = useState<"image" | "video" | null>(null);
  const [urlPreviaArquivo, setUrlPreviaArquivo] = useState("");
  const [linkVideo, setLinkVideo] = useState("");
  const [previaLink, setPreviaLink] = useState<PreviaLink | null>(null);
  const [analisando, setAnalisando] = useState(false);
  const [erroLink, setErroLink] = useState("");
  const [dicaArquivo, setDicaArquivo] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pedidoRef = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    return () => {
      if (urlPreviaArquivo) URL.revokeObjectURL(urlPreviaArquivo);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [urlPreviaArquivo]);

  useEffect(() => {
    if (!estado?.ok) return;
    formRef.current?.reset();
    setLinkVideo("");
    setPreviaLink(null);
    setErroLink("");
    setDicaArquivo("");
    setTipoPrevia(null);
    setUrlPreviaArquivo((atual) => {
      if (atual) URL.revokeObjectURL(atual);
      return "";
    });
  }, [estado]);

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
    setDicaArquivo("");
    setPreviaLink(null);

    if (!limpo) {
      setAnalisando(false);
      return;
    }

    if (pareceInstagram(limpo)) {
      setDicaArquivo(
        "Instagram: envie a prévia (foto ou MP4). Não buscamos automática."
      );
      setAnalisando(false);
      return;
    }

    if (!pareceYoutubeShorts(limpo)) {
      setDicaArquivo(
        "Prévia automática só em YouTube Shorts (/shorts/…). Nos outros links, envie o arquivo."
      );
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
        const data = (await res.json()) as PreviaLink & {
          erro?: string;
          precisaArquivo?: boolean;
        };
        if (pedido !== pedidoRef.current) return;
        if (!res.ok || data.erro) {
          setPreviaLink(null);
          setErroLink(data.erro ?? "Não deu para analisar o link.");
          if (data.precisaArquivo) {
            setDicaArquivo("Envie a prévia em arquivo para publicar.");
          }
          return;
        }
        setPreviaLink({
          plataforma: data.plataforma,
          rotulo: data.rotulo,
          thumbnailUrl: data.thumbnailUrl,
          destino: data.destino,
        });
        setErroLink("");
        setDicaArquivo("");
      } catch {
        if (pedido !== pedidoRef.current) return;
        setPreviaLink(null);
        setErroLink("Falha ao analisar o Shorts. Envie a prévia em arquivo.");
      } finally {
        if (pedido === pedidoRef.current) setAnalisando(false);
      }
    }, 450);
  }

  const mostrandoArquivo = Boolean(urlPreviaArquivo);
  const mostrandoLink = !mostrandoArquivo && Boolean(previaLink?.thumbnailUrl);
  const exigeArquivo =
    pareceInstagram(linkVideo) ||
    (Boolean(linkVideo.trim()) &&
      !pareceYoutubeShorts(linkVideo) &&
      !mostrandoArquivo);

  return (
    <form
      ref={formRef}
      action={action}
      className="space-y-4 rounded-2xl border border-border bg-card p-5"
    >
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
          placeholder="https://www.instagram.com/reel/... ou https://youtube.com/shorts/..."
          className={campo}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Shorts: prévia automática. Instagram: envie a prévia em arquivo.
        </p>
        {analisando ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Buscando prévia do Shorts…
          </p>
        ) : null}
        {erroLink && !mostrandoArquivo ? (
          <p className="mt-2 text-xs text-destructive">{erroLink}</p>
        ) : null}
        {dicaArquivo && !mostrandoArquivo ? (
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
            {dicaArquivo}
          </p>
        ) : null}
        {previaLink && !mostrandoArquivo ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-black">
            <div className="px-3 py-2 text-xs text-white/80">
              Prévia automática · <strong>{previaLink.rotulo}</strong>
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
          Prévia{" "}
          {exigeArquivo || pareceInstagram(linkVideo) ? (
            <span className="text-destructive">(obrigatória neste link)</span>
          ) : (
            <span className="font-normal text-muted-foreground">
              (opcional no Shorts)
            </span>
          )}
        </label>
        <input
          id="previa"
          name="previa"
          type="file"
          required={exigeArquivo || pareceInstagram(linkVideo)}
          disabled={pendente}
          accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
          onChange={(e) => aoEscolherPrevia(e.target.files?.[0])}
          className={campo}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          PNG, JPG, WebP, MP4 ou WebM. Até 12 MB. O arquivo sobe direto pro
          storage (não passa pelo limite da Vercel).
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
      {estado?.ok && (
        <p className="text-sm text-emerald-700">Publicado com sucesso.</p>
      )}
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
