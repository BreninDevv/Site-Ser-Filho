"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { exigeEquipeMidia } from "@/lib/auth/permissoes";
import { embedDoVideo, MAX_TESTEMUNHOS } from "@/lib/midia";
import { uuidValido } from "@/lib/seguranca";

export async function criarTestemunho(formData: FormData) {
  if (!(await exigeEquipeMidia())) return { erro: "Sem permissão." };

  const nome = String(formData.get("nome") ?? "").trim().slice(0, 80);
  const videoUrl = String(formData.get("video_url") ?? "").trim().slice(0, 500);

  if (!nome) return { erro: "Escreva o nome de quem testemunha." };
  if (!embedDoVideo(videoUrl)) {
    return { erro: "Cole o link do Reels, do YouTube Shorts ou do Vimeo." };
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("testemunhos")
    .select("id", { count: "exact", head: true });

  if ((count ?? 0) >= MAX_TESTEMUNHOS) {
    return { erro: "Só cabem 3 vídeos. Remova um para colocar outro." };
  }

  const { error } = await supabase.from("testemunhos").insert({
    nome,
    video_url: videoUrl,
  });

  if (error) {
    return { erro: "Não foi possível salvar. Rode a migration 005 no Supabase." };
  }

  revalidatePath("/painel/testemunhos");
  revalidatePath("/inicio");
  return { ok: true };
}

export async function excluirTestemunho(id: string) {
  if (!uuidValido(id)) return;
  if (!(await exigeEquipeMidia())) return;

  const supabase = await createClient();
  await supabase.from("testemunhos").delete().eq("id", id);

  revalidatePath("/painel/testemunhos");
  revalidatePath("/inicio");
}
