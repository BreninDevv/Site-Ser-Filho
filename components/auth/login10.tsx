"use client";

/**
 * Visual baseado em Login10 (frontend-joe/react-components).
 * Auth real via /api/login; cadastro completo em /cadastro.
 */
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";

import "./login10.css";

const MENSAGENS: Record<string, string> = {
  email_nao_confirmado:
    "Confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada.",
  credenciais: "E-mail ou senha incorretos.",
};

function PasswordField({
  name,
  disabled,
  placeholder = "••••••••",
}: {
  name: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="password-field">
      <input
        name={name}
        type={show ? "text" : "password"}
        required
        disabled={disabled}
        placeholder={placeholder}
        autoComplete={name === "senha" ? "current-password" : "new-password"}
      />
      <button
        type="button"
        className="eye"
        onClick={() => setShow((prev) => !prev)}
        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
      >
        {show ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
      </button>
    </div>
  );
}

function Hero({
  variant,
  title,
  text,
  buttonLabel,
  onSwitch,
}: {
  variant: "login" | "register";
  title: string;
  text: string;
  buttonLabel: string;
  onSwitch: () => void;
}) {
  return (
    <div className={`hero ${variant}`}>
      <h2>{title}</h2>
      <p>{text}</p>
      <button type="button" className="switch" onClick={onSwitch}>
        {buttonLabel}
      </button>
    </div>
  );
}

function RegisterPanel({ destinoVisitante }: { destinoVisitante: string }) {
  return (
    <div className="form register">
      <h2>Criar conta</h2>
      <p className="panel-note">
        O cadastro pede função, equipe pastoral e tempo de igreja. Continue na
        página completa.
      </p>
      <Link href="/cadastro" className="submit-link">
        Ir para o cadastro
      </Link>
      <span className="or">ou</span>
      <a href={destinoVisitante} className="ghost-link">
        Continuar como visitante
      </a>
    </div>
  );
}

function LoginPanel({
  erroInicial,
  destinoAposLogin,
  destinoVisitante,
}: {
  erroInicial?: string;
  destinoAposLogin: string;
  destinoVisitante: string;
}) {
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
        window.location.assign(destinoAposLogin);
        return;
      }

      setErro(MENSAGENS[resultado.codigo ?? ""] ?? MENSAGENS.credenciais);
    } catch {
      setErro(MENSAGENS.credenciais);
    }
    setEnviando(false);
  }

  return (
    <div className="form login">
      <h2>Entrar</h2>
      <form onSubmit={aoEnviar}>
        {erro ? <p className="form-error">{erro}</p> : null}
        <label htmlFor="login-email">E-mail</label>
        <input
          id="login-email"
          name="email"
          type="email"
          required
          disabled={enviando}
          placeholder="seu@email.com"
          autoComplete="email"
        />
        <label htmlFor="login-senha">Senha</label>
        <PasswordField name="senha" disabled={enviando} />
        <div className="remember-forgot">
          <span className="remember-spacer" />
          <Link href="/esqueci-senha" className="forgot">
            Esqueci minha senha
          </Link>
        </div>
        <button type="submit" disabled={enviando}>
          {enviando ? "Entrando..." : "Entrar"}
        </button>
        <span className="or">ou</span>
        <a href={destinoVisitante} className="ghost-link">
          Continuar como visitante
        </a>
      </form>
    </div>
  );
}

export function Login10View({
  erroInicial,
  confirmado,
  senhaRedefinida,
  destinoAposLogin = "/inicio",
}: {
  erroInicial?: string;
  confirmado?: boolean;
  senhaRedefinida?: boolean;
  destinoAposLogin?: string;
}) {
  const [isRegister, setIsRegister] = useState(false);
  const destinoVisitante =
    destinoAposLogin && destinoAposLogin !== "/inicio"
      ? `/api/visitante?next=${encodeURIComponent(destinoAposLogin)}`
      : "/api/visitante";

  return (
    <section className="page login-10">
      <div className="brand-mark" aria-label="Ser Filho">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-ser-filho.png" alt="" width={48} height={48} />
        <span>Ser Filho</span>
      </div>

      {(confirmado || senhaRedefinida) && (
        <p className="flash">
          {confirmado
            ? "E-mail confirmado! Entre com sua conta."
            : "Senha redefinida! Entre com a senha nova."}
        </p>
      )}

      <div className={`card ${isRegister ? "register" : ""}`}>
        <div className="card-bg" />

        <Hero
          variant="register"
          title="Já tem conta?"
          text="Entre para acompanhar inscrições, células e o painel da equipe."
          buttonLabel="Entrar"
          onSwitch={() => setIsRegister(false)}
        />
        <RegisterPanel destinoVisitante={destinoVisitante} />

        <Hero
          variant="login"
          title="Bem-vindo"
          text="Crie sua conta como discípulo, líder, pastor ou equipe do Ser Filho."
          buttonLabel="Cadastrar"
          onSwitch={() => setIsRegister(true)}
        />
        <LoginPanel
          erroInicial={erroInicial}
          destinoAposLogin={destinoAposLogin}
          destinoVisitante={destinoVisitante}
        />
      </div>
    </section>
  );
}
