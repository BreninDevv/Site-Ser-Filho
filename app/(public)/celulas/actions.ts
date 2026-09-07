"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { geocodificarEndereco } from "@/lib/geocoding";
import { calcularDistanciaKm } from "@/lib/geocoding";
import {
  exigeGerenciarCelulas,
  podeMexerNestaCelula,
} from "@/lib/auth/permissoes";
import { uuidValido } from "@/lib/seguranca";

export async function buscarCelulasPorDistancia(
  prevState: { celulas: any[]; error: string | null },
  formData: FormData
) {
  const endereco = formData.get("endereco") as string;
  const supabase = await createClient();

  const coordenadas = await geocodificarEndereco(endereco);
  if (!coordenadas) {
    return { celulas: [], error: "Endereço não encontrado. Tente um endereço mais específico." };
  }

  const { data: celulas } = await supabase
    .from("celulas")
    .select(
      "id, nome, endereco, dia, horario, descricao, lider_id, foto_url, nome_responsavel, latitude, longitude"
    )
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  if (!celulas || celulas.length === 0) {
    return { celulas: [], error: null };
  }

  const visitor = { lat: coordenadas.lat, lng: coordenadas.lng };

  const comDistancia = celulas
    .filter((c: any) => c.latitude && c.longitude)
    .map((c: any) => ({
      ...c,
      distanciaKm: calcularDistanciaKm(visitor, { lat: c.latitude, lng: c.longitude }),
    }))
    .sort((a: any, b: any) => a.distanciaKm - b.distanciaKm);

  return { celulas: comDistancia, error: null };
}

export async function atualizarCelula(
  id: string,
  dados: {
    nome: string;
    endereco: string;
    dia: string;
    horario: string;
    descricao: string;
    nome_responsavel: string;
    foto_url?: string;
  }
) {
  if (!uuidValido(id)) redirect("/celulas");

  const supabase = await createClient();
  const { data: celula } = await supabase
    .from("celulas")
    .select("lider_id")
    .eq("id", id)
    .single();

  if (!(await podeMexerNestaCelula(celula?.lider_id))) redirect("/login");

  const coordenadas = await geocodificarEndereco(dados.endereco);
  const { error } = await supabase
    .from("celulas")
    .update({
      nome: String(dados.nome ?? "").trim().slice(0, 120),
      endereco: String(dados.endereco ?? "").trim().slice(0, 300),
      dia: String(dados.dia ?? "").trim().slice(0, 40),
      horario: String(dados.horario ?? "").trim().slice(0, 40),
      descricao: String(dados.descricao ?? "").trim().slice(0, 1000),
      nome_responsavel: String(dados.nome_responsavel ?? "").trim().slice(0, 80),
      foto_url: dados.foto_url?.slice(0, 500) ?? undefined,
      latitude: coordenadas?.lat ?? null,
      longitude: coordenadas?.lng ?? null,
    })
    .eq("id", id);
  if (error) redirect(`/celulas/${id}/editar?erro=1`);
  redirect("/celulas");
}

export async function excluirCelula(id: string) {
  if (!uuidValido(id)) return;
  if (!(await exigeGerenciarCelulas())) return;

  const supabase = await createClient();
  const { data: celula } = await supabase
    .from("celulas")
    .select("lider_id")
    .eq("id", id)
    .single();

  if (!(await podeMexerNestaCelula(celula?.lider_id))) return;

  await supabase.from("celulas").delete().eq("id", id);
  revalidatePath("/celulas");
}