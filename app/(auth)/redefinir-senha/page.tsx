import { redefinirSenha } from "./actions";

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  const mensagensErro: Record<string, string> = {
    senha_diferente: "As senhas não conferem. Tente novamente.",
    link_invalido: "Este link expirou ou já foi usado. Solicite um novo em 'Esqueci minha senha'.",
  };

  return (
    <div>
      <h1 className="font-heading text-3xl uppercase mb-1">Nova senha</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Escolha uma senha nova para sua conta.
      </p>

      {erro && mensagensErro[erro] && (
        <p className="mb-5 text-sm text-destructive">{mensagensErro[erro]}</p>
      )}

      <form action={redefinirSenha} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">Nova senha</label>
          <input
            name="senha"
            type="password"
            required
            minLength={6}
            className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Confirmar nova senha</label>
          <input
            name="confirmarSenha"
            type="password"
            required
            minLength={6}
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
    </div>
  );
}