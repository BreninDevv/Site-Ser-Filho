"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

const MENSAGENS: Record<string, string> = {
  email_nao_confirmado:
    "Confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada.",
  credenciais: "E-mail ou senha incorretos.",
};

export function LoginForm({ erroInicial }: { erroInicial?: string }) {
  const [erro, setErro] = useState(
    erroInicial && MENSAGENS[erroInicial] ? MENSAGENS[erroInicial] : ""
  );
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setEnviando(true);

    const dados = new FormData(evento.currentTarget);
    try {
      const resposta = await fetch("/api/login", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: String(dados.get("email") ?? ""),
          senha: String(dados.get("senha") ?? ""),
        }),
      });
      const resultado = (await resposta.json()) as {
        status?: string;
        codigo?: string;
      };

      if (resultado.status === "ok") {
        window.location.assign("/inicio");
        return;
      }

      setErro(MENSAGENS[resultado.codigo ?? ""] ?? MENSAGENS.credenciais);
    } catch {
      setErro(MENSAGENS.credenciais);
    }
    setEnviando(false);
  }

  return (
    <form onSubmit={aoEnviar} className="space-y-5">
      {erro && <p className="text-sm text-destructive">{erro}</p>}
      <div>
        <label className="mb-1.5 block text-sm font-medium">E-mail</label>
        <input
          name="email"
          type="email"
          required
          disabled={enviando}
          className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Senha</label>
        <input
          name="senha"
          type="password"
          required
          disabled={enviando}
          className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
        />
        <div className="mt-1.5 text-right">
          <Link
            href="/esqueci-senha"
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Esqueci minha senha
          </Link>
        </div>
      </div>
      <button
        type="submit"
        disabled={enviando}
        className="w-full bg-foreground py-2.5 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-60"
      >
        {enviando ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
