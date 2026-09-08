"use client";

import { startTransition, useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { AvisoPagamentoPresencial } from "@/components/aviso-pagamento-presencial";
import { CopiarTextoButton } from "@/components/copiar-texto-button";
import { createClient } from "@/lib/supabase/client";
import {
  ESTADO_COMPLEMENTO_INICIAL,
  enviarComplementoPagamento,
} from "@/app/(public)/completar-pagamento-actions";
import {
  CHAVE_PIX,
  DESCRICOES_FORMA,
  FORMAS_PAGAMENTO,
  ROTULOS_FORMA,
  TAMANHO_MAX_COMPROVANTE,
  TIPOS_COMPROVANTE,
  exigeComprovante,
  formatarReais,
  type FormaPagamento,
} from "@/lib/validations/pagamento-encontro";

export function CompletarPagamentoForm({
  origem,
  faltaCentavos,
  bucket,
}: {
  origem: "encontro" | "legado";
  faltaCentavos: number;
  bucket: string;
}) {
  const router = useRouter();
  const action = enviarComplementoPagamento.bind(null, origem);
  const [estado, formAction, enviando] = useActionState(
    action,
    ESTADO_COMPLEMENTO_INICIAL
  );
  const [forma, setForma] = useState<FormaPagamento | "">("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [subindo, setSubindo] = useState(false);
  const [erroLocal, setErroLocal] = useState("");

  const ocupado = enviando || subindo;
  const comprovanteObrigatorio = forma ? exigeComprovante(forma) : false;

  async function aoEnviar(formData: FormData) {
    setErroLocal("");

    if (!forma) {
      setErroLocal("Escolha a forma de pagamento.");
      return;
    }

    if (comprovanteObrigatorio && !arquivo) {
      setErroLocal("Anexe o comprovante do pagamento.");
      return;
    }

    if (arquivo && arquivo.size > TAMANHO_MAX_COMPROVANTE) {
      setErroLocal("Arquivo muito grande. O limite é 5 MB.");
      return;
    }

    let caminho = "";
    if (arquivo) {
      setSubindo(true);
      const extensoes: Record<string, string> = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/webp": "webp",
        "application/pdf": "pdf",
      };
      const extensao = extensoes[arquivo.type] ?? "jpg";
      const destino = `${crypto.randomUUID()}.${extensao}`;
      const supabase = createClient();
      const { error } = await supabase.storage
        .from(bucket)
        .upload(destino, arquivo, { contentType: arquivo.type });
      setSubindo(false);

      if (error) {
        setErroLocal("Não foi possível enviar o comprovante. Tente novamente.");
        return;
      }
      caminho = destino;
    }

    formData.set("forma_pagamento", forma);
    formData.set("comprovante_path", caminho);

    startTransition(() => {
      formAction(formData);
    });
  }

  if (estado.status === "sucesso") {
    return (
      <div className="mt-5 border border-[#4b6f36]/40 bg-[#fff8e7] p-4 text-sm leading-relaxed">
        <p className="font-semibold">Complemento enviado</p>
        <p className="mt-1">
          A tesouraria vai conferir o restante. Você pode atualizar a página
          daqui a pouco.
        </p>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="mt-3 text-sm font-semibold underline underline-offset-2"
        >
          Atualizar status
        </button>
      </div>
    );
  }

  return (
    <form action={aoEnviar} className="mt-5 space-y-4 border border-[#dcdad3] p-4">
      <div>
        <p className="text-sm font-semibold">Completar pagamento</p>
        <p className="mt-1 text-sm text-[#141412]/70">
          A entrada já foi aprovada. Falta {formatarReais(faltaCentavos)}.
        </p>
      </div>

      <div className="grid gap-2">
        {FORMAS_PAGAMENTO.map((opcao) => (
          <label
            key={opcao}
            className={`flex cursor-pointer items-start gap-3 border p-3 text-sm ${
              forma === opcao ? "border-foreground" : "border-border"
            }`}
          >
            <input
              type="radio"
              name="forma_pagamento_ui"
              value={opcao}
              checked={forma === opcao}
              onChange={() => setForma(opcao)}
              disabled={ocupado}
              className="mt-1"
            />
            <span>
              <span className="font-medium">{ROTULOS_FORMA[opcao]}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {DESCRICOES_FORMA[opcao]}
              </span>
            </span>
          </label>
        ))}
      </div>

      <AvisoPagamentoPresencial forma={forma} contexto="complemento" />

      {forma === "pix" && (
        <div className="border border-border p-4">
          <p className="text-sm font-semibold">Chave Pix (aleatória)</p>
          <p className="mt-1 break-all font-mono text-sm">{CHAVE_PIX}</p>
          <CopiarTextoButton texto={CHAVE_PIX} />
          <p className="mt-2 text-sm text-muted-foreground">
            Pague {formatarReais(faltaCentavos)} e anexe o comprovante.
          </p>
        </div>
      )}

      {comprovanteObrigatorio && (
        <div>
          <label htmlFor="comprovante-complemento" className="mb-1.5 block text-sm font-medium">
            Comprovante
          </label>
          <input
            id="comprovante-complemento"
            name="comprovante"
            type="file"
            accept={TIPOS_COMPROVANTE.join(",")}
            disabled={ocupado}
            onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
            className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none file:mr-3 file:border-0 file:bg-foreground file:px-3 file:py-1.5 file:text-background file:text-sm"
          />
        </div>
      )}

      {(erroLocal || estado.status === "erro") && (
        <p className="text-sm text-destructive">
          {erroLocal || (estado.status === "erro" ? estado.mensagem : "")}
        </p>
      )}

      <button
        type="submit"
        disabled={ocupado || !forma}
        className="w-full bg-foreground py-2.5 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-60"
      >
        {subindo
          ? "Enviando comprovante..."
          : enviando
            ? "Enviando..."
            : `Enviar restante de ${formatarReais(faltaCentavos)}`}
      </button>
    </form>
  );
}
