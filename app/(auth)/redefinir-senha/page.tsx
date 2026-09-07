import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { redefinirSenha } from "./actions";
import { CapturarSessaoHash } from "./capturar-sessao-hash";
import { SENHA_MINIMA, SENHA_PADRAO, TEXTO_SENHA } from "@/lib/seguranca";

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; code?: string }>;
}) {
  const { erro, code } = await searchParams;

  // E-mails já enviados apontam para cá com ?code=. A troca tem que
  // acontecer numa Route Handler (aqui o cookie não grava).
  if (code) {
    redirect(
      `/auth/callback?code=${encodeURIComponent(code)}&next=/redefinir-senha`
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const mensagensErro: Record<string, string> = {
    senha_diferente: "As senhas não conferem. Tente novamente.",
    link_invalido:
      "Este link expirou ou já foi usado. Solicite um novo em Esqueci minha senha.",
    senha_fraca: TEXTO_SENHA,
  };

  return (
    <div>
      <CapturarSessaoHash />

      <h1 className="font-heading text-3xl uppercase mb-1">Nova senha</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Escolha uma senha nova para sua conta.
      </p>

      {erro && mensagensErro[erro] && (
        <p className="mb-5 text-sm text-destructive">{mensagensErro[erro]}</p>
      )}

      {!user ? (
        <div>
          <p className="mb-5 text-sm text-destructive">
            Este link expirou, já foi usado ou precisa ser aberto no mesmo
            navegador em que você pediu a recuperação.
          </p>
          <Link
            href="/esqueci-senha"
            className="inline-block w-full bg-foreground py-2.5 text-center text-sm font-semibold text-background hover:bg-foreground/90"
          >
            Pedir um link novo
          </Link>
        </div>
      ) : (
        <form action={redefinirSenha} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">Nova senha</label>
            <input
              name="senha"
              type="password"
              required
              minLength={SENHA_MINIMA}
              maxLength={72}
              pattern={SENHA_PADRAO}
              title={TEXTO_SENHA}
              className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">{TEXTO_SENHA}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Confirmar nova senha
            </label>
            <input
              name="confirmarSenha"
              type="password"
              required
              minLength={SENHA_MINIMA}
              maxLength={72}
              pattern={SENHA_PADRAO}
              title={TEXTO_SENHA}
              className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-foreground text-background py-2.5 text-sm font-semibold hover:bg-foreground/90"
          >
            Salvar nova senha
          </button>
        </form>
      )}
    </div>
  );
}
