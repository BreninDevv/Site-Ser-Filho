"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { uuidValido } from "@/lib/seguranca";
import {
  ehRoleCadastro,
  ehSexoCadastro,
  ehTempoIgreja,
  precisaEscolherEquipe,
} from "@/lib/validations/cadastro";

function revalidar() {
  revalidatePath("/perfil");
  revalidatePath("/painel/solicitacoes-perfil");
}

export async function atualizarDadosBasicos(formData: FormData) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { erro: "Faça login para editar o perfil." };

    const nome = String(formData.get("nome") ?? "").trim().slice(0, 80);
    const sexo = String(formData.get("sexo") ?? "").trim().toLowerCase();
    const tempoIgreja = String(formData.get("tempo_igreja") ?? "").trim();

    if (nome.length < 2) return { erro: "Escreva seu nome." };
    if (!ehSexoCadastro(sexo)) {
      return { erro: "Escolha Homem ou Mulher." };
    }
    if (!ehTempoIgreja(tempoIgreja)) {
      return { erro: "Escolha há quanto tempo está na igreja." };
    }

    const { error } = await supabase
      .from("perfis")
      .update({
        nome,
        sexo,
        tempo_igreja: tempoIgreja,
      })
      .eq("id", user.id);

    if (error) {
      return {
        erro:
          /sexo|check/i.test(error.message)
            ? "Sexo inválido. Rode supabase/migrations/030_perfil_edicao.sql."
            : `Não foi possível salvar. ${error.message}`,
      };
    }

    revalidar();
    return { ok: true };
  } catch (erro) {
    console.error("atualizarDadosBasicos", erro);
    return { erro: "Deu erro ao salvar. Tente de novo." };
  }
}

export async function solicitarEquipeOuFuncao(formData: FormData) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { erro: "Faça login para solicitar mudanças." };

    const { data: perfil } = await supabase
      .from("perfis")
      .select("role, equipe_id")
      .eq("id", user.id)
      .single();

    if (!perfil) return { erro: "Perfil não encontrado." };

    const roleNovaRaw = String(formData.get("role_nova") ?? "").trim();
    const equipeIdRaw = String(formData.get("equipe_id_nova") ?? "").trim();
    const motivo = String(formData.get("motivo") ?? "").trim().slice(0, 280);

    const roleNova =
      roleNovaRaw && ehRoleCadastro(roleNovaRaw) ? roleNovaRaw : null;
    const equipeIdNova =
      equipeIdRaw && uuidValido(equipeIdRaw) ? equipeIdRaw : null;

    if (!roleNova && !equipeIdNova) {
      return { erro: "Escolha uma nova função e/ou equipe." };
    }

    if (roleNova === perfil.role && (!equipeIdNova || equipeIdNova === perfil.equipe_id)) {
      return { erro: "Nada mudou em relação ao que já está no perfil." };
    }

    if (
      roleNova &&
      precisaEscolherEquipe(roleNova) &&
      !equipeIdNova &&
      !perfil.equipe_id
    ) {
      return {
        erro: "Para essa função, escolha também a equipe pastoral.",
      };
    }

    if (equipeIdNova) {
      const { data: equipe } = await supabase
        .from("equipes_pastorais")
        .select("id")
        .eq("id", equipeIdNova)
        .maybeSingle();
      if (!equipe) return { erro: "Equipe pastoral inválida." };
    }

    // Substitui pedido pendente anterior.
    await supabase
      .from("solicitacoes_perfil")
      .delete()
      .eq("usuario_id", user.id)
      .eq("status", "pendente");

    const { error } = await supabase.from("solicitacoes_perfil").insert({
      usuario_id: user.id,
      equipe_id_nova:
        equipeIdNova && equipeIdNova !== perfil.equipe_id
          ? equipeIdNova
          : null,
      role_nova: roleNova && roleNova !== perfil.role ? roleNova : null,
      motivo,
      status: "pendente",
    });

    if (error) {
      if (/solicitacoes_perfil_tem_pedido/i.test(error.message)) {
        return { erro: "Escolha uma função ou equipe diferente da atual." };
      }
      return {
        erro:
          /could not find|PGRST/i.test(error.message)
            ? "Falta a migration. Rode supabase/migrations/030_perfil_edicao.sql."
            : `Não foi possível enviar o pedido. ${error.message}`,
      };
    }

    revalidar();
    return { ok: true };
  } catch (erro) {
    console.error("solicitarEquipeOuFuncao", erro);
    return { erro: "Deu erro ao enviar o pedido. Tente de novo." };
  }
}

export async function cancelarSolicitacaoPendente() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { erro: "Faça login." };

    await supabase
      .from("solicitacoes_perfil")
      .delete()
      .eq("usuario_id", user.id)
      .eq("status", "pendente");

    revalidar();
    return { ok: true };
  } catch (erro) {
    console.error("cancelarSolicitacaoPendente", erro);
    return { erro: "Não foi possível cancelar." };
  }
}
