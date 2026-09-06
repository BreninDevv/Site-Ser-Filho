import Link from "next/link";
import { solicitarRecuperacao } from "./actions";

export default async function EsqueciSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <div>
      <h1 className="font-heading text-3xl uppercase mb-1">Esqueci minha senha</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Digite seu e-mail e enviaremos um link para você criar uma senha nova.
      </p>

      {erro === "link_invalido" && (
        <p className="mb-5 text-sm text-destructive">
          Esse link expirou ou já foi usado. Peça um novo abaixo. Abra o e-mail
          no mesmo aparelho e navegador em que você fez o pedido.
        </p>
      )}

      <form action={solicitarRecuperacao} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">E-mail</label>
          <input
            name="email"
            type="email"
            required
            className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-foreground text-background py-2.5 text-sm font-semibold hover:bg-foreground/90"
        >
          Enviar link de recuperação
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Lembrou a senha?{" "}
        <Link href="/login" className="font-semibold text-foreground underline underline-offset-4">
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}