import { createClient } from "@/lib/supabase/server";
import { TEXTO_SENHA } from "@/lib/senha";
import { FormCadastro } from "./form-cadastro";

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  const mensagens: Record<string, string> = {
    senha_diferente: "As senhas não conferem. Tente novamente.",
    senha_fraca: TEXTO_SENHA,
    cadastro_falhou: "Não foi possível criar sua conta. Verifique os dados e tente de novo.",
    dados_incompletos: "Preencha quem você é e o tempo de igreja.",
    equipe_pastor: "Pastor, informe o nome da sua equipe pastoral.",
    equipe_obrigatoria: "Escolha a equipe pastoral do seu pastor.",
  };

  const supabase = await createClient();
  const { data: equipes, error: erroEquipes } = await supabase
    .from("equipes_pastorais")
    .select("id, nome")
    .order("nome");

  return (
    <div className="mx-auto mt-12 max-w-sm px-4 pb-16">
      <h1 className="mb-2 text-2xl font-semibold">Criar conta</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Diga quem você é, a equipe pastoral e há quanto tempo está na igreja.
        Discípulo fica na base e acompanha o pagamento, sem painel.
      </p>

      {erro && mensagens[erro] && (
        <p className="mb-4 text-sm text-red-600">{mensagens[erro]}</p>
      )}

      <FormCadastro equipes={erroEquipes ? [] : equipes ?? []} />
    </div>
  );
}
