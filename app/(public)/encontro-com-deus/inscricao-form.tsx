"use client";

import { useActionState } from "react";
import { inscreverNoEncontro } from "./actions";
import {
  ESTADO_INICIAL,
  OPCOES_COMO_SOUBE,
  OPCOES_SEXO,
  type CampoInscricao,
} from "@/lib/validations/inscricao-encontro";

const CLASSE_CAMPO =
  "w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground";
const CLASSE_ROTULO = "block text-sm font-medium mb-1.5";

const ROTULOS_SEXO: Record<(typeof OPCOES_SEXO)[number], string> = {
  feminino: "Feminino",
  masculino: "Masculino",
  outro: "Prefiro não informar",
};

function MensagemErro({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="mt-1.5 text-sm text-destructive">{children}</p>;
}

export function InscricaoForm() {
  const [estado, formAction, enviando] = useActionState(
    inscreverNoEncontro,
    ESTADO_INICIAL
  );

  if (estado.status === "sucesso") {
    const primeiroNome = estado.nome.split(" ")[0];

    return (
      <div className="border border-border p-8 text-center">
        <h2 className="font-heading text-2xl uppercase">Inscrição enviada</h2>
        <p className="mt-4 text-sm text-muted-foreground">
          Obrigado, {primeiroNome}! Recebemos sua inscrição. Um líder vai entrar em
          contato pelo telefone ou e-mail que você informou para confirmar sua vaga.
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

  const erros = estado.status === "erro" ? estado.erros : {};
  const valorDe = (campo: CampoInscricao) =>
    estado.status === "erro" ? estado.valores[campo] : "";

  return (
    <form action={formAction} className="space-y-5">
      {estado.status === "erro" && (
        <p
          aria-live="polite"
          className="border border-destructive/40 p-4 text-sm text-destructive"
        >
          {estado.mensagem ?? "Confira os campos destacados abaixo."}
        </p>
      )}

      <div>
        <label htmlFor="nome_completo" className={CLASSE_ROTULO}>
          Nome completo
        </label>
        <input
          id="nome_completo"
          name="nome_completo"
          required
          defaultValue={valorDe("nome_completo")}
          disabled={enviando}
          aria-invalid={Boolean(erros.nome_completo)}
          className={CLASSE_CAMPO}
        />
        <MensagemErro>{erros.nome_completo}</MensagemErro>
      </div>

      <div>
        <label htmlFor="data_nascimento" className={CLASSE_ROTULO}>
          Data de nascimento
        </label>
        <input
          id="data_nascimento"
          name="data_nascimento"
          type="date"
          required
          defaultValue={valorDe("data_nascimento")}
          disabled={enviando}
          aria-invalid={Boolean(erros.data_nascimento)}
          className={CLASSE_CAMPO}
        />
        <MensagemErro>{erros.data_nascimento}</MensagemErro>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className={CLASSE_ROTULO}>
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            required
            defaultValue={valorDe("email")}
            disabled={enviando}
            aria-invalid={Boolean(erros.email)}
            className={CLASSE_CAMPO}
          />
          <MensagemErro>{erros.email}</MensagemErro>
        </div>

        <div>
          <label htmlFor="telefone" className={CLASSE_ROTULO}>
            Telefone (WhatsApp)
          </label>
          <input
            id="telefone"
            name="telefone"
            type="tel"
            inputMode="tel"
            required
            placeholder="(11) 91234-5678"
            defaultValue={valorDe("telefone")}
            disabled={enviando}
            aria-invalid={Boolean(erros.telefone)}
            className={CLASSE_CAMPO}
          />
          <MensagemErro>{erros.telefone}</MensagemErro>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="sexo" className={CLASSE_ROTULO}>
            Sexo <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <select
            id="sexo"
            name="sexo"
            defaultValue={valorDe("sexo")}
            disabled={enviando}
            aria-invalid={Boolean(erros.sexo)}
            className={CLASSE_CAMPO}
          >
            <option value="">Selecione</option>
            {OPCOES_SEXO.map((opcao) => (
              <option key={opcao} value={opcao}>
                {ROTULOS_SEXO[opcao]}
              </option>
            ))}
          </select>
          <MensagemErro>{erros.sexo}</MensagemErro>
        </div>

        <div>
          <label htmlFor="cidade" className={CLASSE_ROTULO}>
            Cidade <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <input
            id="cidade"
            name="cidade"
            defaultValue={valorDe("cidade")}
            disabled={enviando}
            className={CLASSE_CAMPO}
          />
        </div>
      </div>

      <fieldset className="border-t border-border pt-5">
        <legend className="text-sm font-semibold">
          Contato de emergência{" "}
          <span className="font-normal text-muted-foreground">(opcional)</span>
        </legend>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="nome_contato_emergencia" className={CLASSE_ROTULO}>
              Nome
            </label>
            <input
              id="nome_contato_emergencia"
              name="nome_contato_emergencia"
              defaultValue={valorDe("nome_contato_emergencia")}
              disabled={enviando}
              className={CLASSE_CAMPO}
            />
          </div>
          <div>
            <label htmlFor="telefone_contato_emergencia" className={CLASSE_ROTULO}>
              Telefone
            </label>
            <input
              id="telefone_contato_emergencia"
              name="telefone_contato_emergencia"
              type="tel"
              inputMode="tel"
              placeholder="(11) 91234-5678"
              defaultValue={valorDe("telefone_contato_emergencia")}
              disabled={enviando}
              aria-invalid={Boolean(erros.telefone_contato_emergencia)}
              className={CLASSE_CAMPO}
            />
            <MensagemErro>{erros.telefone_contato_emergencia}</MensagemErro>
          </div>
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
          defaultValue={valorDe("como_soube")}
          disabled={enviando}
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
          defaultValue={valorDe("observacoes")}
          disabled={enviando}
          aria-invalid={Boolean(erros.observacoes)}
          placeholder="Alergias, restrições alimentares, uso de medicamentos..."
          className={CLASSE_CAMPO}
        />
        <MensagemErro>{erros.observacoes}</MensagemErro>
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="w-full bg-foreground text-background py-2.5 text-sm font-semibold hover:bg-foreground/90 disabled:opacity-60"
      >
        {enviando ? "Enviando..." : "Quero me inscrever"}
      </button>

      <p className="text-xs text-muted-foreground">
        Seus dados são usados apenas para organizar o Encontro e não são divulgados.
      </p>
    </form>
  );
}
