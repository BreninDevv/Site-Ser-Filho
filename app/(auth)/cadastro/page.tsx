import { cadastrar } from "./actions";

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  const mensagens: Record<string, string> = {
    senha_diferente: "As senhas não conferem. Tente novamente.",
    cadastro_falhou: "Não foi possível criar sua conta. Verifique os dados e tente de novo.",
  };

  return (
    <div className="max-w-sm mx-auto mt-20 px-4">
      <h1 className="text-2xl font-semibold mb-6">Criar conta de líder</h1>

      {erro && mensagens[erro] && (
        <p className="text-sm text-red-600 mb-4">{mensagens[erro]}</p>
      )}

      <form action={cadastrar} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Nome</label>
          <input name="nome" required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">E-mail</label>
          <input name="email" type="email" required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Senha</label>
          <input name="senha" type="password" required minLength={6} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Confirmar senha</label>
          <input name="confirmarSenha" type="password" required minLength={6} className="w-full border rounded px-3 py-2" />
        </div>
        <button type="submit" className="w-full bg-black text-white rounded py-2">
          Cadastrar
        </button>
      </form>
    </div>
  );
}