"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AvisoPagamentoPresencial } from "@/components/aviso-pagamento-presencial";
import { AvisoStatusCadastro } from "@/components/aviso-status-cadastro";
import { CopiarTextoButton } from "@/components/copiar-texto-button";
import { createClient } from "@/lib/supabase/client";
import {
  BUCKET_COMPROVANTES_EVENTO,
  CHAVE_PIX,
  DESCRICOES_FORMA,
  ESTADO_INICIAL_EVENTO,
  FORMAS_PAGAMENTO,
  ROTULOS_FORMA,
  TAMANHO_MAX_COMPROVANTE,
  TIPOS_COMPROVANTE,
  exigeComprovante,
  formatarReais,
  type FormaPagamento,
} from "@/lib/validations/inscricao-evento";
import { inscreverNoEvento } from "./actions";

const campo =
  "w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground";

export function InscricaoEventoForm({
  eventoId,
  valorCentavos,
  logado,
}: {
  eventoId: string;
  valorCentavos: number;
  logado: boolean;
}) {
  const router = useRouter();
  const [forma, setForma] = useState<FormaPagamento | "">("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [subindo, setSubindo] = useState(false);
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  const [estado, action, pendente] = useActionState(
    async (
      _prev: Awaited<ReturnType<typeof inscreverNoEvento>>,
      formData: FormData
    ) => {
      return inscreverNoEvento(eventoId, _prev, formData);
    },
    ESTADO_INICIAL_EVENTO
  );

  const comprovanteObrigatorio =
    forma !== "" && exigeComprovante(forma as FormaPagamento);

  async function aoEnviar(formData: FormData) {
    setErroLocal(null);

    if (comprovanteObrigatorio && !arquivo) {
      setErroLocal("Anexe o comprovante do pagamento.");
      return;
    }

    if (arquivo) {
      if (arquivo.size > TAMANHO_MAX_COMPROVANTE) {
        setErroLocal("O comprovante pode ter no máximo 5 MB.");
        return;
      }
      if (!TIPOS_COMPROVANTE.includes(arquivo.type as (typeof TIPOS_COMPROVANTE)[number])) {
        setErroLocal("Envie PNG, JPG, WebP ou PDF.");
        return;
      }

      setSubindo(true);
      const extensoes: Record<string, string> = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/webp": "webp",
        "application/pdf": "pdf",
      };
      const destino = `${crypto.randomUUID()}.${extensoes[arquivo.type] ?? "jpg"}`;
      const supabase = createClient();
      const { error } = await supabase.storage
        .from(BUCKET_COMPROVANTES_EVENTO)
        .upload(destino, arquivo, { contentType: arquivo.type });
      setSubindo(false);

      if (error) {
        setErroLocal(
          "Não foi possível enviar o comprovante. Rode a migration 009 no Supabase."
        );
        return;
      }
      formData.set("comprovante_path", destino);
    }

    action(formData);
  }

  useEffect(() => {
    if (estado.status === "sucesso") router.refresh();
  }, [estado, router]);

  if (estado.status === "sucesso") {
    return (
      <div className="space-y-2 text-sm">
        <p>Inscrição enviada, {estado.nome}.</p>
        <p>
          Status do pagamento: <strong>Em análise</strong>. A tesouraria
          confere e depois aparece como aprovado ou recusado
          {logado
            ? " no bloco abaixo."
            : ". Para acompanhar, crie uma conta e entre no site."}
        </p>
      </div>
    );
  }

  const ocupado = pendente || subindo;
  const erroComprovante =
    erroLocal ||
    (estado.status === "erro" ? estado.erros.comprovante_path : undefined);

  return (
    <form action={aoEnviar} className="space-y-4">
      <input
        type="checkbox"
        name="hp_campo_extra"
        tabIndex={-1}
        autoComplete="off"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
        aria-hidden="true"
      />
      <AvisoStatusCadastro logado={logado} />
      <p className="text-sm text-muted-foreground">
        Valor: <strong>{formatarReais(valorCentavos)}</strong>
      </p>
      <div>
        <label htmlFor="nome" className="mb-1.5 block text-sm font-medium">
          Nome completo
        </label>
        <input id="nome" name="nome" required disabled={ocupado} className={campo} />
        {estado.status === "erro" && estado.erros.nome && (
          <p className="mt-1 text-sm text-destructive">{estado.erros.nome}</p>
        )}
      </div>
      <div>
        <label htmlFor="idade" className="mb-1.5 block text-sm font-medium">
          Idade
        </label>
        <input
          id="idade"
          name="idade"
          type="number"
          min={1}
          max={120}
          required
          disabled={ocupado}
          className={campo}
        />
        {estado.status === "erro" && estado.erros.idade && (
          <p className="mt-1 text-sm text-destructive">{estado.erros.idade}</p>
        )}
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Forma de pagamento</p>
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
                name="forma_pagamento"
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
        {estado.status === "erro" && estado.erros.forma_pagamento && (
          <p className="mt-1 text-sm text-destructive">
            {estado.erros.forma_pagamento}
          </p>
        )}
      </div>
      <AvisoPagamentoPresencial forma={forma} />
      {forma === "pix" && (
        <div className="rounded-xl bg-muted p-4 text-sm">
          <p className="font-medium">Chave Pix</p>
          <p className="mt-1 break-all">{CHAVE_PIX}</p>
          <CopiarTextoButton texto={CHAVE_PIX} />
        </div>
      )}
      {comprovanteObrigatorio && (
        <div>
          <label htmlFor="comprovante" className="mb-1.5 block text-sm font-medium">
            Comprovante
          </label>
          <input
            id="comprovante"
            name="comprovante"
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            disabled={ocupado}
            onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
            className="w-full text-sm"
          />
          {erroComprovante && (
            <p className="mt-1 text-sm text-destructive">{erroComprovante}</p>
          )}
        </div>
      )}
      {estado.status === "erro" && estado.mensagem && (
        <p className="text-sm text-destructive">{estado.mensagem}</p>
      )}
      <button
        type="submit"
        disabled={ocupado}
        className="w-full rounded-full bg-foreground py-2.5 text-sm font-semibold text-background disabled:opacity-60"
      >
        {ocupado ? "Enviando..." : "Enviar inscrição"}
      </button>
    </form>
  );
}
