"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { geocodificarEndereco } from "@/lib/geocoding";

export async function criarCelula(dados: {
  nome: string;
  endereco: string;
  dia: string;
  horario: string;
  descricao: string;
  nome_responsavel: string;
  foto_url: string | null;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const coordenadas = await geocodificarEndereco(dados.endereco);

  const { error } = await supabase.from("celulas").insert({
    ...dados,
    latitude: coordenadas?.lat ?? null,
    longitude: coordenadas?.lng ?? null,
    lider_id: user.id,
  });

  if (error) {
    redirect("/celulas/nova?erro=1");
  }

  redirect("/celulas");
}