"use client";

import { useState, type FormEvent } from "react";
import { AvisoPagamentoPresencial } from "@/components/aviso-pagamento-presencial";
import { AvisoStatusCadastro } from "@/components/aviso-status-cadastro";
import { CopiarTextoButton } from "@/components/copiar-texto-button";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { enviarInscricaoJson } from "@/lib/inscricoes/http";
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
  type EstadoInscricaoEvento,
  type FormaPagamento,
} from "@/lib/validations/inscricao-evento";
import { OPCOES_SEXO, ROTULOS_SEXO } from "@/lib/validations/inscricao-encontro";

const campo =
  "w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground";

export function InscricaoEventoForm({
  eventoId,
  valorCentavos,
  logado,
  pastores,
}: {
  eventoId: string;
  valorCentavos: number;
  logado: boolean;
  pastores: { id: string; nome: string }[];
}) {
  const [forma, setForma] = useState<FormaPagamento | "">("");
  const [idade, setIdade] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [arquivoAutorizacao, setArquivoAutorizacao] = useState<File | null>(
    null
  );
  const [subindo, setSubindo] = useState(false);
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoInscricaoEvento>(ESTADO_INICIAL_EVENTO);
  const [pendente, setPendente] = useState(false);

  const comprovanteObrigatorio =
    forma !== "" && exigeComprovante(forma as FormaPagamento);
  const menor = Number(idade) > 0 && Number(idade) < 18;

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formData = new FormData(evento.currentTarget);
    setErroLocal(null);

    if (comprovanteObrigatorio && !arquivo) {
      setErroLocal("Anexe o comprovante do pagamento.");
      return;
    }

    if (menor && !arquivoAutorizacao) {
      setErroLocal("Menor de 18 anos: envie a foto da autorização do líder.");
      return;
    }

    const supabase = createClient();
    const extensoes: Record<string, string> = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
      "application/pdf": "pdf",
    };

    async function upload(file: File, bucket: string) {
      if (file.size > TAMANHO_MAX_COMPROVANTE) {
        setErroLocal("O arquivo pode ter no máximo 5 MB.");
        return null;
      }
      if (
        !TIPOS_COMPROVANTE.includes(
          file.type as (typeof TIPOS_COMPROVANTE)[number]
        )
      ) {
        setErroLocal("Envie PNG, JPG, WebP ou PDF.");
        return null;
      }
      const destino = `${crypto.randomUUID()}.${extensoes[file.type] ?? "jpg"}`;
      const { error } = await supabase.storage
        .from(bucket)
        .upload(destino, file, { contentType: file.type });
      if (error) return null;
      return destino;
    }

    setSubindo(true);

    if (arquivoAutorizacao) {
      const pathAuth = await upload(arquivoAutorizacao, BUCKET_COMPROVANTES_EVENTO);
      if (!pathAuth) {
        setSubindo(false);
        if (!erroLocal) {
          setErroLocal(
            "Não foi possível enviar a foto da autorização. Tente de novo."
          );
        }
        return;
      }
      formData.set("autorizacao_path", pathAuth);
    }

    if (arquivo) {
      const pathComp = await upload(arquivo, BUCKET_COMPROVANTES_EVENTO);
      if (!pathComp) {
        setSubindo(false);
        if (!erroLocal) {
          setErroLocal(
            "Não foi possível enviar o comprovante. Rode a migration 009 no Supabase."
          );
        }
        return;
      }
      formData.set("comprovante_path", pathComp);
    }

    setSubindo(false);
    formData.delete("comprovante");
    formData.delete("autorizacao");
    formData.set("evento_id", eventoId);
    setPendente(true);
    const resultado = await enviarInscricaoJson<EstadoInscricaoEvento>(
      "/api/inscricoes/evento",
      formData,
      {
        status: "erro",
        erros: {},
        mensagem: "Não foi possível enviar sua inscrição agora. Tente novamente.",
      }
    );
    setEstado(resultado);
    setPendente(false);
  }

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
  const erroGeral =
    erroLocal ||
    (estado.status === "erro"
      ? estado.erros.comprovante_path ||
        estado.erros.autorizacao_path ||
        estado.erros.pastor_id
      : undefined);

  return (
    <form onSubmit={aoEnviar} className="space-y-4">
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
          value={idade}
          onChange={(e) => setIdade(e.target.value)}
          className={campo}
        />
        {estado.status === "erro" && estado.erros.idade && (
          <p className="mt-1 text-sm text-destructive">{estado.erros.idade}</p>
        )}
      </div>
      {menor && (
        <div className="border border-border bg-muted/40 p-4 text-sm">
          <p className="font-semibold">Menor de 18 anos</p>
          <p className="mt-1 text-muted-foreground">
            Envie a foto da autorização assinada pelo líder.
          </p>
          <label
            htmlFor="autorizacao"
            className="mb-1.5 mt-3 block text-sm font-medium"
          >
            Foto da autorização (obrigatório)
          </label>
          <input
            id="autorizacao"
            name="autorizacao"
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            disabled={ocupado}
            onChange={(e) => setArquivoAutorizacao(e.target.files?.[0] ?? null)}
            className="w-full text-sm"
          />
        </div>
      )}
      <div>
        <label htmlFor="pastor_id" className="mb-1.5 block text-sm font-medium">
          De qual pastor? (obrigatório)
        </label>
        <select
          id="pastor_id"
          name="pastor_id"
          required
          disabled={ocupado || pastores.length === 0}
          className={campo}
        >
          <option value="">
            {pastores.length === 0
              ? "Nenhum pastor cadastrado ainda"
              : "Selecione o pastor"}
          </option>
          {pastores.map((pastor) => (
            <option key={pastor.id} value={pastor.id}>
              {pastor.nome}
            </option>
          ))}
        </select>
        {estado.status === "erro" && estado.erros.pastor_id && (
          <p className="mt-1 text-sm text-destructive">
            {estado.erros.pastor_id}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="sexo" className="mb-1.5 block text-sm font-medium">
          Sexo
        </label>
        <select id="sexo" name="sexo" required disabled={ocupado} className={campo}>
          <option value="">Selecione</option>
          {OPCOES_SEXO.map((opcao) => (
            <option key={opcao} value={opcao}>
              {ROTULOS_SEXO[opcao]}
            </option>
          ))}
        </select>
        {estado.status === "erro" && estado.erros.sexo && (
          <p className="mt-1 text-sm text-destructive">{estado.erros.sexo}</p>
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
        </div>
      )}
      {erroGeral && <p className="text-sm text-destructive">{erroGeral}</p>}
      {estado.status === "erro" && estado.mensagem && (
        <p className="text-sm text-destructive">{estado.mensagem}</p>
      )}
      <LiquidButton
        type="submit"
        disabled={ocupado}
        size="lg"
        className="w-full"
      >
        {ocupado ? "Enviando..." : "Enviar inscrição"}
      </LiquidButton>
    </form>
  );
}
