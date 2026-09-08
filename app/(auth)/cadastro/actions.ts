"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  dentroDoLimite,
  emailValido,
  ipDoPedido,
  origemDoSite,
  senhaForte,
  uuidValido,
} from "@/lib/seguranca";
import {
  ehRoleCadastro,
  ehTempoIgreja,
  precisaEscolherEquipe,
} from "@/lib/validations/cadastro";

export async function cadastrar(formData: FormData) {
  const senha = String(formData.get("senha") ?? "");
  const confirmarSenha = String(formData.get("confirmarSenha") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const nome = String(formData.get("nome") ?? "").trim().slice(0, 80);
  const funcao = String(formData.get("funcao") ?? "").trim();
  const tempoIgreja = String(formData.get("tempo_igreja") ?? "").trim();
  const equipeNome = String(formData.get("equipe_nome") ?? "").trim().slice(0, 80);
  const equipeId = String(formData.get("equipe_id") ?? "").trim();

  if (!emailValido(email) || nome.length < 2) {
    redirect("/cadastro?erro=cadastro_falhou");
  }

  if (!ehRoleCadastro(funcao) || !ehTempoIgreja(tempoIgreja)) {
    redirect("/cadastro?erro=dados_incompletos");
  }

  if (funcao === "pastor" && equipeNome.length < 3) {
    redirect("/cadastro?erro=equipe_pastor");
  }

  const supabase = await createClient();
  const { data: equipes } = await supabase
    .from("equipes_pastorais")
    .select("id");

  if (precisaEscolherEquipe(funcao) && (equipes?.length ?? 0) > 0) {
    if (!uuidValido(equipeId) || !equipes?.some((e) => e.id === equipeId)) {
      redirect("/cadastro?erro=equipe_obrigatoria");
    }
  }

  if (!senhaForte(senha)) {
    redirect("/cadastro?erro=senha_fraca");
  }

  if (senha !== confirmarSenha) {
    redirect("/cadastro?erro=senha_diferente");
  }

  const ip = await ipDoPedido();
  if (!dentroDoLimite(`cadastro:${ip}`, 8, 15 * 60 * 1000)) {
    redirect("/cadastro?erro=cadastro_falhou");
  }

  const origin = await origemDoSite();

  const { error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: {
        nome,
        role: funcao,
        tempo_igreja: tempoIgreja,
        equipe_nome: funcao === "pastor" ? equipeNome : "",
        equipe_id: funcao === "pastor" ? "" : equipeId,
      },
      emailRedirectTo: `${origin}/auth/confirmar-email`,
    },
  });

  if (error) {
    redirect("/cadastro?erro=cadastro_falhou");
  }

  redirect(`/cadastro/verifique-email?email=${encodeURIComponent(email)}`);
}
