"use client";

import { useState, type FormEvent } from "react";

export function UnicasInscricaoForm() {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [errosCampo, setErrosCampo] = useState<Record<string, string>>({});

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setErrosCampo({});
    setEnviando(true);

    const dados = new FormData(evento.currentTarget);
    try {
      const resposta = await fetch("/api/unicas/inscricao", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: String(dados.get("nome") ?? ""),
          email: String(dados.get("email") ?? ""),
          telefone: String(dados.get("telefone") ?? ""),
          data_nascimento: String(dados.get("data_nascimento") ?? ""),
          cidade: String(dados.get("cidade") ?? ""),
        }),
      });
      const resultado = (await resposta.json()) as {
        status?: string;
        nome?: string;
        erros?: Record<string, string>;
        mensagem?: string;
        codigo?: string;
      };

      if (resultado.status === "ok") {
        setSucesso(resultado.nome ?? "");
        evento.currentTarget.reset();
        setEnviando(false);
        return;
      }

      if (resultado.erros) setErrosCampo(resultado.erros);
      if (resultado.codigo === "gravacao") {
        setErro(
          "Inscrição ainda não está ligada ao banco. Peça à equipe para rodar as migrations 026, 027 e 028 no Supabase."
        );
      } else if (resultado.codigo === "nao_autenticado") {
        setErro("Faça login para se inscrever em Únicas.");
      } else {
        setErro(
          resultado.mensagem ??
            (resultado.codigo === "genero_nao_permitido"
              ? "Acesso restrito ao público de Únicas."
              : "Não foi possível enviar. Tente de novo.")
        );
      }
    } catch {
      setErro("Não foi possível enviar. Tente de novo.");
    }
    setEnviando(false);
  }

  if (sucesso !== null) {
    return (
      <div className="unicas-form">
        <p className="unicas-body">
          Recebemos sua inscrição{sucesso ? `, ${sucesso}` : ""}. Em breve a
          equipe confirma.
        </p>
      </div>
    );
  }

  return (
    <form
      id="unicas-form"
      className="unicas-form"
      onSubmit={aoEnviar}
      noValidate
    >
      <div className="unicas-field mb-4">
        <label className="unicas-label form-label" htmlFor="unicas-nome">
          Nome completo
        </label>
        <input
          id="unicas-nome"
          name="nome"
          type="text"
          className="unicas-input form-control form-control-lg"
          placeholder="Digite seu nome completo"
          required
          autoComplete="name"
          disabled={enviando}
          aria-label="Nome completo"
        />
        {errosCampo.nome ? (
          <p className="unicas-error">{errosCampo.nome}</p>
        ) : null}
      </div>

      <div className="unicas-field mb-4">
        <label className="unicas-label form-label" htmlFor="unicas-email">
          Email
        </label>
        <input
          id="unicas-email"
          name="email"
          type="email"
          className="unicas-input form-control form-control-lg"
          placeholder="seu@email.com"
          required
          autoComplete="email"
          disabled={enviando}
          aria-label="Email"
        />
        {errosCampo.email ? (
          <p className="unicas-error">{errosCampo.email}</p>
        ) : null}
      </div>

      <div className="unicas-field mb-4">
        <label className="unicas-label form-label" htmlFor="unicas-telefone">
          Telefone
        </label>
        <input
          id="unicas-telefone"
          name="telefone"
          type="tel"
          className="unicas-input form-control form-control-lg"
          placeholder="(11) 99999-9999"
          required
          autoComplete="tel"
          disabled={enviando}
          aria-label="Telefone"
        />
        {errosCampo.telefone ? (
          <p className="unicas-error">{errosCampo.telefone}</p>
        ) : null}
      </div>

      <div className="unicas-field mb-4">
        <label
          className="unicas-label form-label"
          htmlFor="unicas-data-nascimento"
        >
          Data de nascimento
        </label>
        <input
          id="unicas-data-nascimento"
          name="data_nascimento"
          type="date"
          className="unicas-input form-control form-control-lg unicas-input--date"
          required
          disabled={enviando}
          aria-label="Data de nascimento"
        />
        {errosCampo.data_nascimento ? (
          <p className="unicas-error">{errosCampo.data_nascimento}</p>
        ) : null}
      </div>

      <div className="unicas-field mb-5">
        <label className="unicas-label form-label" htmlFor="unicas-cidade">
          Cidade
        </label>
        <input
          id="unicas-cidade"
          name="cidade"
          type="text"
          className="unicas-input form-control form-control-lg"
          placeholder="Digite sua cidade"
          required
          autoComplete="address-level2"
          disabled={enviando}
          aria-label="Cidade"
        />
        {errosCampo.cidade ? (
          <p className="unicas-error">{errosCampo.cidade}</p>
        ) : null}
      </div>

      {erro ? <p className="unicas-error">{erro}</p> : null}

      <div className="unicas-submit-wrap">
        <button
          type="submit"
          className="unicas-submit-btn btn-unicas-primary"
          disabled={enviando}
        >
          <span className="rosa-glyph" aria-hidden="true">
            ❀
          </span>
          {enviando ? "Enviando..." : "Confirmar Inscrição"}
          <span className="rosa-glyph" aria-hidden="true">
            ❀
          </span>
        </button>
        <p className="unicas-privacy">
          Seus dados estão seguros conosco. Em caso de dúvida, fale com a
          equipe do ministério.
        </p>
      </div>
    </form>
  );
}
