import Link from "next/link";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    erro?: string;
    confirmado?: string;
    senha_redefinida?: string;
  }>;
}) {
  const { erro, confirmado, senha_redefinida } = await searchParams;

  return (
    <div>
      <h1 className="font-heading mb-1 text-3xl uppercase">Entrar</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Depois de entrar você vai para a página inicial, com o globo. Quem tem
        acesso à equipe vê o botão Painel no menu.
      </p>

      {confirmado === "1" && (
        <p className="mb-5 border border-border bg-muted px-4 py-3 text-sm">
          E-mail confirmado! Se você já tinha outra aba aberta aguardando,
          pode fechar esta e continuar por lá — ou entrar direto aqui mesmo,
          tanto faz.
        </p>
      )}

      {senha_redefinida === "1" && (
        <p className="mb-5 border border-border bg-muted px-4 py-3 text-sm">
          Senha redefinida com sucesso! Entre com sua senha nova.
        </p>
      )}

      <LoginForm erroInicial={erro} />

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
      <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
        Visitante pode se inscrever nos eventos. O status do pagamento só
        aparece para quem tem conta.
      </p>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link
          href="/cadastro"
          className="font-semibold text-foreground underline underline-offset-4"
        >
          Cadastre-se
        </Link>{" "}
        e entre como discípulo.
      </p>
    </div>
  );
}
