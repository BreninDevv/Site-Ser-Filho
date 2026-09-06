import Link from "next/link";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; confirmado?: string }>;
}) {
  const { erro, confirmado } = await searchParams;

  const mensagensErro: Record<string, string> = {
    email_nao_confirmado: "Confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada.",
    credenciais: "E-mail ou senha incorretos.",
  };

  return (
    <div>
      <h1 className="font-heading text-3xl uppercase mb-1">Entrar</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Acesso para líderes, pastores e administração.
      </p>

      {confirmado === "1" && (
        <p className="mb-5 border border-border bg-muted px-4 py-3 text-sm">
          E-mail confirmado! Se você já tinha outra aba aberta aguardando,
          pode fechar esta e continuar por lá — ou entrar direto aqui
          mesmo, tanto faz.
        </p>
      )}

      {erro && mensagensErro[erro] && (
        <p className="mb-5 text-sm text-destructive">{mensagensErro[erro]}</p>
      )}

      <form action={login} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">E-mail</label>
          <input
            name="email"
            type="email"
            required
            className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Senha</label>
          <input
            name="senha"
            type="password"
            required
            className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-foreground text-background py-2.5 text-sm font-semibold hover:bg-foreground/90"
        >
          Entrar
        </button>
      </form>

      <div className="mt-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">ou</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Link
        href="/inicio"
        className="mt-6 block w-full border border-border py-2.5 text-center text-sm font-semibold hover:bg-muted"
      >
        Continuar como visitante
      </Link>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        É líder ou pastor e ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-semibold text-foreground underline underline-offset-4">
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}