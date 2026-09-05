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
    <div className="max-w-sm mx-auto mt-20 px-4">
      <h1 className="text-2xl font-semibold mb-6">Entrar</h1>

      {confirmado === "1" && (
        <p className="text-sm text-green-700 mb-4">
          E-mail confirmado! Se você já tinha outra aba aberta aguardando, pode
          fechar esta e continuar por lá — ou entrar direto aqui mesmo, tanto faz.
        </p>
      )}

      {erro && mensagensErro[erro] && (
        <p className="text-sm text-red-600 mb-4">{mensagensErro[erro]}</p>
      )}

      <form action={login} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">E-mail</label>
          <input name="email" type="email" required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Senha</label>
          <input name="senha" type="password" required className="w-full border rounded px-3 py-2" />
        </div>
        <button type="submit" className="w-full bg-black text-white rounded py-2">
          Entrar
        </button>
      </form>
    </div>
  );
}