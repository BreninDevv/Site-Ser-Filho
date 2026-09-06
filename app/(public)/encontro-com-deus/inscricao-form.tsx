"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CopiarTextoButton } from "@/components/copiar-texto-button";
import { createClient } from "@/lib/supabase/client";
import { inscreverNoEncontro } from "./actions";
import {
  CAMPOS_INSCRICAO,
  ESTADO_INICIAL,
  OPCOES_COMO_SOUBE,
  OPCOES_SEXO,
  lerValores,
  validarInscricao,
  type CampoFormulario,
  type ErrosFormulario,
  type ValoresInscricao,
} from "@/lib/validations/inscricao-encontro";
import {
  BUCKET_COMPROVANTES,
  CHAVE_PIX,
  DESCRICOES_FORMA,
  FORMAS_PAGAMENTO,
  MAX_CRIANCAS,
  MAX_PARCELAS,
  ROTULOS_FORMA,
  TAMANHO_MAX_COMPROVANTE,
  TIPOS_COMPROVANTE,
  VALOR_CRIANCA_CENTAVOS,
  VALOR_ENCONTRO_CENTAVOS,
  VALOR_ENTRADA_CENTAVOS,
  aceitaParcelamento,
  calcularValores,
  exigeComprovante,
  formatarReais,
  type FormaPagamento,
  type OpcaoValor,
} from "@/lib/validations/pagamento-encontro";

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
  campo: CampoFormulario;
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

const VALORES_ETAPA1_VAZIOS = CAMPOS_INSCRICAO.reduce((acumulado, campo) => {
  acumulado[campo] = "";
  return acumulado;
}, {} as ValoresInscricao);

export function InscricaoForm() {
  const [estado, formAction, enviandoAction] = useActionState(
    inscreverNoEncontro,
    ESTADO_INICIAL
  );

  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [estadoVisto, setEstadoVisto] = useState(estado);
  if (estado !== estadoVisto) {
    setEstadoVisto(estado);
    if (estado.status === "erro") setEtapa(estado.etapa);
  }
  const [errosLocais, setErrosLocais] = useState<ErrosFormulario>({});
  const [dadosEtapa1, setDadosEtapa1] = useState<ValoresInscricao>(
    VALORES_ETAPA1_VAZIOS
  );

  const [forma, setForma] = useState<FormaPagamento | "">("");
  const [parcelas, setParcelas] = useState(1);
  const [opcaoValor, setOpcaoValor] = useState<OpcaoValor | "">("");
  const [levaCrianca, setLevaCrianca] = useState<"sim" | "nao" | "">("");
  const [qtdCriancas, setQtdCriancas] = useState("1");
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
          Obrigado, {primeiroNome}! Sua inscrição foi enviada e está{" "}
          <strong className="text-foreground">aguardando aprovação</strong>. A
          equipe vai conferir o pagamento e confirmar sua vaga pelo telefone ou
          e-mail que você informou.
        </p>
        <a
          href="/encontro-com-deus"
          className="mt-6 inline-block border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
        >
          Inscrever outra pessoa
        </a>
      </div>
    );
  }

  const errosServidor = estado.status === "erro" ? estado.erros : {};
  const erros: ErrosFormulario = { ...errosServidor, ...errosLocais };
  const valoresServidor = estado.status === "erro" ? estado.valores : {};

  const valorEtapa1 = (campo: keyof ValoresInscricao) =>
    dadosEtapa1[campo] || valoresServidor[campo] || "";

  const quantidade = levaCrianca === "sim" ? Number(qtdCriancas || "0") : 0;
  const calculo = calcularValores({
    opcao: opcaoValor === "total" ? "total" : "entrada",
    qtdCriancas: Number.isFinite(quantidade) ? quantidade : 0,
    forma: forma || null,
    parcelas: forma === "credito" ? parcelas : null,
  });

  const comprovanteObrigatorio = forma ? exigeComprovante(forma) : false;
  const qtdValida =
    levaCrianca !== "sim" ||
    (Number.isInteger(Number(qtdCriancas)) && Number(qtdCriancas) >= 1);
  const podeEnviar = Boolean(
    forma &&
      opcaoValor &&
      levaCrianca &&
      qtdValida &&
      (!comprovanteObrigatorio || arquivo || caminhoComprovante)
  );

  function irParaPagamento() {
    const formulario = formRef.current;
    if (!formulario) return;

    const valores = lerValores(new FormData(formulario));
    const { erros: errosEtapa1 } = validarInscricao(valores);

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

  async function aoEnviar(formData: FormData) {
    setErrosLocais({});

    if (comprovanteObrigatorio && !arquivo && !caminhoComprovante) {
      setErrosLocais({ comprovante_path: "Anexe o comprovante do pagamento." });
      return;
    }

    let caminho = caminhoComprovante;

    if (arquivo && !caminho) {
      setSubindo(true);
      const supabase = createClient();
      const extensao = arquivo.name.split(".").pop()?.toLowerCase() ?? "png";
      const destino = `${crypto.randomUUID()}.${extensao}`;

      const { error } = await supabase.storage
        .from(BUCKET_COMPROVANTES)
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

    // A etapa 1 está desmontada nesta altura: os valores vão por campos ocultos.
    for (const campo of CAMPOS_INSCRICAO) {
      formData.set(campo, dadosEtapa1[campo] ?? "");
    }
    formData.delete("comprovante");
    formData.set("comprovante_path", caminho);

    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <form ref={formRef} action={aoEnviar} className="space-y-6">
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

          <div>
            <label htmlFor="como_soube" className={CLASSE_ROTULO}>
              Como você soube do Encontro?{" "}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <select
              id="como_soube"
              name="como_soube"
              defaultValue={valorEtapa1("como_soube")}
              disabled={ocupado}
              className={CLASSE_CAMPO}
            >
              <option value="">Selecione</option>
              {OPCOES_COMO_SOUBE.map((opcao) => (
                <option key={opcao} value={opcao}>
                  {opcao}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="observacoes" className={CLASSE_ROTULO}>
              Alguma observação de saúde ou alimentação?{" "}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <textarea
              id="observacoes"
              name="observacoes"
              rows={3}
              defaultValue={valorEtapa1("observacoes")}
              disabled={ocupado}
              aria-invalid={Boolean(erros.observacoes)}
              aria-describedby={erros.observacoes ? "erro-observacoes" : undefined}
              placeholder="Alergias, restrições alimentares, uso de medicamentos..."
              className={CLASSE_CAMPO}
            />
            <MensagemErro id="erro-observacoes">{erros.observacoes}</MensagemErro>
          </div>

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
              Vai levar criança?
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <OpcaoRadio
                name="leva_crianca"
                value="nao"
                checked={levaCrianca === "nao"}
                onChange={(v) => setLevaCrianca(v as "nao")}
                disabled={ocupado}
                titulo="Não"
              />
              <OpcaoRadio
                name="leva_crianca"
                value="sim"
                checked={levaCrianca === "sim"}
                onChange={(v) => setLevaCrianca(v as "sim")}
                disabled={ocupado}
                titulo="Sim"
                descricao={`${formatarReais(VALOR_CRIANCA_CENTAVOS)} por criança, todas as idades`}
              />
            </div>
            <MensagemErro id="erro-leva_crianca">{erros.leva_crianca}</MensagemErro>

            {levaCrianca === "sim" && (
              <div className="mt-4 max-w-40">
                <label htmlFor="qtd_criancas" className={CLASSE_ROTULO}>
                  Quantas crianças?
                </label>
                <input
                  id="qtd_criancas"
                  name="qtd_criancas"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MAX_CRIANCAS}
                  value={qtdCriancas}
                  onChange={(e) => setQtdCriancas(e.target.value)}
                  disabled={ocupado}
                  aria-invalid={Boolean(erros.qtd_criancas)}
                  aria-describedby={
                    erros.qtd_criancas ? "erro-qtd_criancas" : undefined
                  }
                  className={CLASSE_CAMPO}
                />
                <MensagemErro id="erro-qtd_criancas">
                  {erros.qtd_criancas}
                </MensagemErro>
              </div>
            )}
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
                descricao="Garante sua vaga. O restante você paga até o Encontro."
              />
              <OpcaoRadio
                name="opcao_valor"
                value="total"
                checked={opcaoValor === "total"}
                onChange={(v) => setOpcaoValor(v as OpcaoValor)}
                disabled={ocupado}
                titulo={`Valor total — ${formatarReais(calculo.devido)}`}
                descricao={
                  quantidade > 0
                    ? `${formatarReais(VALOR_ENCONTRO_CENTAVOS)} da inscrição + ${quantidade} criança(s)`
                    : "Fica tudo quitado de uma vez."
                }
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
                  const comTaxa = calcularValores({
                    opcao: opcaoValor === "total" ? "total" : "entrada",
                    qtdCriancas: quantidade,
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
              Imagem ou PDF, até 5 MB. Só a equipe do Encontro vê esse arquivo.
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
                Preencha o pagamento
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
