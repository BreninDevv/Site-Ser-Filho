"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { AvisoPagamentoPresencial } from "@/components/aviso-pagamento-presencial";
import { AvisoStatusCadastro } from "@/components/aviso-status-cadastro";
import { CopiarTextoButton } from "@/components/copiar-texto-button";
import { enviarInscricaoJson } from "@/lib/inscricoes/http";
import { createClient } from "@/lib/supabase/client";
import {
  CAMPOS_INSCRICAO_LEGADO,
  ESTADO_INICIAL_LEGADO,
  OPCOES_SEXO,
  lerValoresLegado,
  validarInscricaoLegado,
  type CampoFormularioLegado,
  type ErrosFormularioLegado,
  type EstadoInscricaoLegado,
  type ValoresInscricaoLegado,
} from "@/lib/validations/inscricao-legado";
import {
  BUCKET_COMPROVANTES_LEGADO,
  CHAVE_PIX,
  DESCRICOES_FORMA,
  FORMAS_PAGAMENTO,
  MAX_PARCELAS,
  ROTULOS_FORMA,
  TAMANHO_MAX_COMPROVANTE,
  TIPOS_COMPROVANTE,
  VALOR_ENTRADA_CENTAVOS,
  VALOR_LEGADO_CENTAVOS,
  aceitaParcelamento,
  calcularValoresLegado,
  exigeComprovante,
  formatarReais,
  type FormaPagamento,
  type OpcaoValor,
} from "@/lib/validations/pagamento-legado";

const CLASSE_CAMPO =
  "w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground";
const CLASSE_ROTULO = "block text-sm font-medium mb-1.5";

const ROTULOS_SEXO: Record<(typeof OPCOES_SEXO)[number], string> = {
  feminino: "Feminino",
  masculino: "Masculino",
  outro: "Prefiro não informar",
};

function MensagemErro({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1.5 text-sm text-destructive">
      {children}
    </p>
  );
}

function CampoTexto({
  campo,
  rotulo,
  erro,
  opcional,
  ...props
}: {
  campo: CampoFormularioLegado;
  rotulo: string;
  erro?: string;
  opcional?: boolean;
} & React.ComponentProps<"input">) {
  const idErro = `erro-${campo}`;

  return (
    <div>
      <label htmlFor={campo} className={CLASSE_ROTULO}>
        {rotulo}{" "}
        {opcional && (
          <span className="font-normal text-muted-foreground">(opcional)</span>
        )}
      </label>
      <input
        {...props}
        id={campo}
        name={campo}
        aria-invalid={Boolean(erro)}
        aria-describedby={erro ? idErro : undefined}
        className={CLASSE_CAMPO}
      />
      <MensagemErro id={idErro}>{erro}</MensagemErro>
    </div>
  );
}

function OpcaoRadio({
  name,
  value,
  checked,
  onChange,
  disabled,
  titulo,
  descricao,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (valor: string) => void;
  disabled?: boolean;
  titulo: ReactNode;
  descricao?: ReactNode;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 border p-4 ${
        checked ? "border-foreground" : "border-border"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
        className="mt-0.5"
      />
      <span>
        <span className="block text-sm font-semibold">{titulo}</span>
        {descricao && (
          <span className="mt-0.5 block text-sm text-muted-foreground">
            {descricao}
          </span>
        )}
      </span>
    </label>
  );
}

const VALORES_ETAPA1_VAZIOS = CAMPOS_INSCRICAO_LEGADO.reduce((acumulado, campo) => {
  acumulado[campo] = "";
  return acumulado;
}, {} as ValoresInscricaoLegado);

export function InscricaoLegadoForm({ logado }: { logado: boolean }) {
  const [estado, setEstado] = useState<EstadoInscricaoLegado>(ESTADO_INICIAL_LEGADO);
  const [enviandoAction, setEnviandoAction] = useState(false);

  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [estadoVisto, setEstadoVisto] = useState(estado);
  if (estado !== estadoVisto) {
    setEstadoVisto(estado);
    if (estado.status === "erro") setEtapa(estado.etapa);
  }
  const [errosLocais, setErrosLocais] = useState<ErrosFormularioLegado>({});
  const [dadosEtapa1, setDadosEtapa1] = useState<ValoresInscricaoLegado>(
    VALORES_ETAPA1_VAZIOS
  );

  const [forma, setForma] = useState<FormaPagamento | "">("");
  const [parcelas, setParcelas] = useState(1);
  const [opcaoValor, setOpcaoValor] = useState<OpcaoValor | "">("");
  const [primeiroLegado, setPrimeiroLegado] = useState<"sim" | "nao" | "">("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [caminhoComprovante, setCaminhoComprovante] = useState("");
  const [subindo, setSubindo] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const tituloEtapaRef = useRef<HTMLHeadingElement>(null);

  const ocupado = enviandoAction || subindo;

  useEffect(() => {
    if (etapa === 2) tituloEtapaRef.current?.focus();
  }, [etapa]);

  if (estado.status === "sucesso") {
    const primeiroNome = estado.nome.split(" ")[0];

    return (
      <div className="border border-border p-8 text-center">
        <h3 className="font-heading text-2xl uppercase">Inscrição enviada</h3>
        <p className="mt-4 text-sm text-muted-foreground">
          Obrigado, {primeiroNome}! Sua inscrição foi enviada. Status do
          pagamento:{" "}
          <strong className="text-foreground">Em análise</strong>. A equipe
          vai conferir o pagamento e confirmar sua vaga pelo telefone ou
          e-mail que você informou.
          {!logado &&
            " Para ver o status do pagamento nesta página, crie uma conta com o mesmo e-mail da inscrição."}
        </p>
        <a
          href="/legado-de-cristo"
          className="mt-6 inline-block border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
        >
          Inscrever outra pessoa
        </a>
      </div>
    );
  }

  const errosServidor = estado.status === "erro" ? estado.erros : {};
  const erros: ErrosFormularioLegado = { ...errosServidor, ...errosLocais };
  const valoresServidor = estado.status === "erro" ? estado.valores : {};

  const valorEtapa1 = (campo: keyof ValoresInscricaoLegado) =>
    dadosEtapa1[campo] || valoresServidor[campo] || "";

  const calculo = calcularValoresLegado({
    opcao: opcaoValor === "total" ? "total" : "entrada",
    forma: forma || null,
    parcelas: forma === "credito" ? parcelas : null,
  });

  const comprovanteObrigatorio = forma ? exigeComprovante(forma) : false;
  const podeEnviar = Boolean(
    forma &&
      opcaoValor &&
      primeiroLegado &&
      (!comprovanteObrigatorio || arquivo || caminhoComprovante)
  );

  function irParaPagamento() {
    const formulario = formRef.current;
    if (!formulario) return;

    const valores = lerValoresLegado(new FormData(formulario));
    const { erros: errosEtapa1 } = validarInscricaoLegado(valores);

    setDadosEtapa1(valores);

    if (Object.keys(errosEtapa1).length > 0) {
      setErrosLocais(errosEtapa1);
      return;
    }

    setErrosLocais({});
    setEtapa(2);
  }

  function voltarParaDados() {
    setErrosLocais({});
    setEtapa(1);
  }

  function aoEscolherArquivo(escolhido: File | null) {
    setCaminhoComprovante("");
    setArquivo(escolhido);

    if (!escolhido) {
      setErrosLocais((atual) => ({ ...atual, comprovante_path: undefined }));
      return;
    }

    if (escolhido.size > TAMANHO_MAX_COMPROVANTE) {
      setErrosLocais((atual) => ({
        ...atual,
        comprovante_path: "Arquivo muito grande. O limite é 5 MB.",
      }));
      setArquivo(null);
      return;
    }

    if (!TIPOS_COMPROVANTE.includes(escolhido.type as (typeof TIPOS_COMPROVANTE)[number])) {
      setErrosLocais((atual) => ({
        ...atual,
        comprovante_path: "Envie uma imagem (PNG, JPG, WebP) ou um PDF.",
      }));
      setArquivo(null);
      return;
    }

    setErrosLocais((atual) => ({ ...atual, comprovante_path: undefined }));
  }

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formData = new FormData(evento.currentTarget);
    setErrosLocais({});

    if (!primeiroLegado) {
      setErrosLocais({ primeiro_legado: "Diga se este é o seu primeiro Legado." });
      return;
    }

    if (comprovanteObrigatorio && !arquivo && !caminhoComprovante) {
      setErrosLocais({ comprovante_path: "Anexe o comprovante do pagamento." });
      return;
    }

    let caminho = caminhoComprovante;

    if (arquivo && !caminho) {
      setSubindo(true);
      const supabase = createClient();
      const extensoes: Record<string, string> = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/webp": "webp",
        "application/pdf": "pdf",
      };
      const extensao = extensoes[arquivo.type] ?? "jpg";
      const destino = `${crypto.randomUUID()}.${extensao}`;

      const { error } = await supabase.storage
        .from(BUCKET_COMPROVANTES_LEGADO)
        .upload(destino, arquivo, { contentType: arquivo.type });

      setSubindo(false);

      if (error) {
        setErrosLocais({
          comprovante_path:
            "Não foi possível enviar o comprovante. Tente novamente.",
        });
        return;
      }

      caminho = destino;
      setCaminhoComprovante(destino);
    }

    for (const campo of CAMPOS_INSCRICAO_LEGADO) {
      formData.set(campo, dadosEtapa1[campo] ?? "");
    }
    formData.delete("comprovante");
    formData.set("comprovante_path", caminho);
    formData.set("primeiro_legado", primeiroLegado);

    setEnviandoAction(true);
    const resultado = await enviarInscricaoJson<EstadoInscricaoLegado>(
      "/api/inscricoes/legado",
      formData,
      {
        status: "erro",
        erros: {},
        valores: {},
        etapa: 2,
        mensagem:
          "Não foi possível enviar sua inscrição agora. Tente novamente em alguns instantes.",
      }
    );
    setEstado(resultado);
    setEnviandoAction(false);
  }

  return (
    <form ref={formRef} onSubmit={aoEnviar} className="space-y-6">
      <input
        type="checkbox"
        name="hp_campo_extra"
        tabIndex={-1}
        autoComplete="off"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
        aria-hidden="true"
      />
      <AvisoStatusCadastro logado={logado} />
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Etapa {etapa} de 2 — {etapa === 1 ? "seus dados" : "pagamento"}
      </p>

      {estado.status === "erro" && (
        <p
          role="alert"
          className="border border-destructive/40 p-4 text-sm text-destructive"
        >
          {estado.mensagem ?? "Confira os campos destacados abaixo."}
        </p>
      )}

      {etapa === 1 ? (
        <div className="space-y-5">
          <CampoTexto
            campo="nome_completo"
            rotulo="Nome completo"
            erro={erros.nome_completo}
            defaultValue={valorEtapa1("nome_completo")}
            disabled={ocupado}
          />

          <CampoTexto
            campo="data_nascimento"
            rotulo="Data de nascimento"
            type="date"
            erro={erros.data_nascimento}
            defaultValue={valorEtapa1("data_nascimento")}
            disabled={ocupado}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <CampoTexto
              campo="email"
              rotulo="E-mail"
              type="email"
              inputMode="email"
              erro={erros.email}
              defaultValue={valorEtapa1("email")}
              disabled={ocupado}
            />
            <CampoTexto
              campo="telefone"
              rotulo="Telefone (WhatsApp)"
              type="tel"
              inputMode="tel"
              placeholder="(11) 91234-5678"
              erro={erros.telefone}
              defaultValue={valorEtapa1("telefone")}
              disabled={ocupado}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="sexo" className={CLASSE_ROTULO}>
                Sexo{" "}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </label>
              <select
                id="sexo"
                name="sexo"
                defaultValue={valorEtapa1("sexo")}
                disabled={ocupado}
                className={CLASSE_CAMPO}
              >
                <option value="">Selecione</option>
                {OPCOES_SEXO.map((opcao) => (
                  <option key={opcao} value={opcao}>
                    {ROTULOS_SEXO[opcao]}
                  </option>
                ))}
              </select>
            </div>
            <CampoTexto
              campo="cidade"
              rotulo="Cidade"
              opcional
              defaultValue={valorEtapa1("cidade")}
              disabled={ocupado}
            />
          </div>

          <fieldset className="border-t border-border pt-5">
            <legend className="text-sm font-semibold">
              Contato de emergência{" "}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </legend>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <CampoTexto
                campo="nome_contato_emergencia"
                rotulo="Nome"
                defaultValue={valorEtapa1("nome_contato_emergencia")}
                disabled={ocupado}
              />
              <CampoTexto
                campo="telefone_contato_emergencia"
                rotulo="Telefone"
                type="tel"
                inputMode="tel"
                placeholder="(11) 91234-5678"
                erro={erros.telefone_contato_emergencia}
                defaultValue={valorEtapa1("telefone_contato_emergencia")}
                disabled={ocupado}
              />
            </div>
          </fieldset>

          <button
            type="button"
            onClick={irParaPagamento}
            className="w-full bg-foreground text-background py-2.5 text-sm font-semibold hover:bg-foreground/90"
          >
            Quero me inscrever
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <h3
            ref={tituloEtapaRef}
            tabIndex={-1}
            className="font-heading text-2xl uppercase outline-none"
          >
            Pagamento
          </h3>

          <fieldset>
            <legend className="text-sm font-semibold mb-3">
              Este é o seu primeiro Legado?
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <OpcaoRadio
                name="primeiro_legado"
                value="sim"
                checked={primeiroLegado === "sim"}
                onChange={(v) => setPrimeiroLegado(v as "sim")}
                disabled={ocupado}
                titulo="Sim"
                descricao="É a primeira vez que participo."
              />
              <OpcaoRadio
                name="primeiro_legado"
                value="nao"
                checked={primeiroLegado === "nao"}
                onChange={(v) => setPrimeiroLegado(v as "nao")}
                disabled={ocupado}
                titulo="Não"
                descricao="Já participei de outro Legado."
              />
            </div>
            <MensagemErro id="erro-primeiro_legado">{erros.primeiro_legado}</MensagemErro>
          </fieldset>

          <fieldset className="border-t border-border pt-6">
            <legend className="text-sm font-semibold mb-3">
              Quanto você vai pagar agora?
            </legend>
            <div className="grid gap-3">
              <OpcaoRadio
                name="opcao_valor"
                value="entrada"
                checked={opcaoValor === "entrada"}
                onChange={(v) => setOpcaoValor(v as OpcaoValor)}
                disabled={ocupado}
                titulo={`Só a entrada — ${formatarReais(VALOR_ENTRADA_CENTAVOS)}`}
                descricao="Garante sua vaga. O restante você paga até o Legado."
              />
              <OpcaoRadio
                name="opcao_valor"
                value="total"
                checked={opcaoValor === "total"}
                onChange={(v) => setOpcaoValor(v as OpcaoValor)}
                disabled={ocupado}
                titulo={`Valor total — ${formatarReais(VALOR_LEGADO_CENTAVOS)}`}
                descricao="Fica tudo quitado de uma vez."
              />
            </div>
            <MensagemErro id="erro-opcao_valor">{erros.opcao_valor}</MensagemErro>
          </fieldset>

          <fieldset className="border-t border-border pt-6">
            <legend className="text-sm font-semibold mb-3">
              Forma de pagamento
            </legend>
            <div className="grid gap-3">
              {FORMAS_PAGAMENTO.map((opcao) => (
                <OpcaoRadio
                  key={opcao}
                  name="forma_pagamento"
                  value={opcao}
                  checked={forma === opcao}
                  onChange={(v) => setForma(v as FormaPagamento)}
                  disabled={ocupado}
                  titulo={ROTULOS_FORMA[opcao]}
                  descricao={DESCRICOES_FORMA[opcao]}
                />
              ))}
            </div>
            <MensagemErro id="erro-forma_pagamento">
              {erros.forma_pagamento}
            </MensagemErro>
          </fieldset>

          <AvisoPagamentoPresencial forma={forma} />

          {forma === "pix" && (
            <div className="border border-border p-4">
              <p className="text-sm font-semibold">Chave Pix (aleatória)</p>
              <p className="mt-1 break-all font-mono text-sm">{CHAVE_PIX}</p>
              <CopiarTextoButton texto={CHAVE_PIX} />
              <p className="mt-2 text-sm text-muted-foreground">
                Pague {formatarReais(calculo.cobrado)} e anexe o comprovante abaixo.
              </p>
            </div>
          )}

          {forma && aceitaParcelamento(forma) && (
            <div className="max-w-60">
              <label htmlFor="parcelas" className={CLASSE_ROTULO}>
                Parcelas
              </label>
              <select
                id="parcelas"
                name="parcelas"
                value={parcelas}
                onChange={(e) => setParcelas(Number(e.target.value))}
                disabled={ocupado}
                className={CLASSE_CAMPO}
              >
                {Array.from({ length: MAX_PARCELAS }, (_, i) => i + 1).map((n) => {
                  const comTaxa = calcularValoresLegado({
                    opcao: opcaoValor === "total" ? "total" : "entrada",
                    forma: "credito",
                    parcelas: n,
                  });
                  return (
                    <option key={n} value={n}>
                      {n === 1
                        ? `À vista — ${formatarReais(comTaxa.cobrado)} (sem taxa)`
                        : `${n}x de ${formatarReais(Math.round(comTaxa.cobrado / n))} — total ${formatarReais(comTaxa.cobrado)}`}
                    </option>
                  );
                })}
              </select>
              <MensagemErro id="erro-parcelas">{erros.parcelas}</MensagemErro>
            </div>
          )}

          <div className="border-t border-border pt-6">
            <label htmlFor="comprovante" className={CLASSE_ROTULO}>
              Comprovante{" "}
              {!comprovanteObrigatorio && (
                <span className="font-normal text-muted-foreground">(opcional)</span>
              )}
            </label>
            <input
              id="comprovante"
              name="comprovante"
              type="file"
              accept={TIPOS_COMPROVANTE.join(",")}
              onChange={(e) => aoEscolherArquivo(e.target.files?.[0] ?? null)}
              disabled={ocupado}
              aria-invalid={Boolean(erros.comprovante_path)}
              aria-describedby="ajuda-comprovante"
              className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none file:mr-3 file:border-0 file:bg-foreground file:px-3 file:py-1.5 file:text-background file:text-sm"
            />
            <p id="ajuda-comprovante" className="mt-1 text-xs text-muted-foreground">
              Imagem ou PDF, até 5 MB. Só a equipe do Legado vê esse arquivo.
            </p>
            <MensagemErro id="erro-comprovante_path">
              {erros.comprovante_path}
            </MensagemErro>
          </div>

          <div
            aria-live="polite"
            className="border border-foreground bg-muted/40 p-4 text-sm"
          >
            <p className="flex justify-between">
              <span>Total da inscrição</span>
              <strong>{formatarReais(calculo.devido)}</strong>
            </p>
            <p className="mt-1 flex justify-between">
              <span>Você vai pagar agora</span>
              <strong>{formatarReais(calculo.cobrado)}</strong>
            </p>
            {calculo.taxaAplicada && (
              <p className="mt-1 text-xs text-muted-foreground">
                Já inclui a taxa do parcelamento no crédito.
              </p>
            )}
            {calculo.escolhido < calculo.devido && (
              <p className="mt-1 flex justify-between text-muted-foreground">
                <span>Fica para depois</span>
                <span>{formatarReais(calculo.devido - calculo.escolhido)}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row-reverse">
            {podeEnviar ? (
              <button
                type="submit"
                disabled={ocupado}
                aria-busy={ocupado}
                className="flex-1 bg-foreground text-background py-2.5 text-sm font-semibold hover:bg-foreground/90 disabled:opacity-60"
              >
                {subindo
                  ? "Enviando comprovante..."
                  : enviandoAction
                    ? "Enviando..."
                    : "Enviar inscrição"}
              </button>
            ) : (
              <p className="flex-1 border border-dashed border-border px-4 py-2.5 text-center text-sm text-muted-foreground">
                Preencha se é o primeiro Legado, o pagamento
                {comprovanteObrigatorio ? " e anexe o comprovante" : ""} para
                enviar.
              </p>
            )}
            <button
              type="button"
              onClick={voltarParaDados}
              disabled={ocupado}
              className="border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-60"
            >
              Voltar aos dados
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            Ao enviar, sua inscrição fica aguardando aprovação da equipe. Você não
            está inscrito ainda: a confirmação vem depois da conferência do
            pagamento.
          </p>
        </div>
      )}
    </form>
  );
}
