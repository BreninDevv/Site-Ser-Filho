"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { geocodificarEndereco } from "@/lib/geocoding";
import { exigeGerenciarCelulas, obterPerfilAtual } from "@/lib/auth/permissoes";

export async function criarCelula(dados: {
  nome: string;
  endereco: string;
  dia: string;
  horario: string;
  descricao: string;
  nome_responsavel: string;
  foto_url: string | null;
}) {
  if (!(await exigeGerenciarCelulas())) {
    redirect("/login");
  }

  const perfil = await obterPerfilAtual();
  if (!perfil) redirect("/login");

  const supabase = await createClient();
  const coordenadas = await geocodificarEndereco(dados.endereco);

  const { error } = await supabase.from("celulas").insert({
    nome: String(dados.nome ?? "").trim().slice(0, 120),
    endereco: String(dados.endereco ?? "").trim().slice(0, 300),
    dia: String(dados.dia ?? "").trim().slice(0, 40),
    horario: String(dados.horario ?? "").trim().slice(0, 40),
    descricao: String(dados.descricao ?? "").trim().slice(0, 1000),
    nome_responsavel: String(dados.nome_responsavel ?? "").trim().slice(0, 80),
    foto_url: dados.foto_url?.slice(0, 500) ?? null,
    latitude: coordenadas?.lat ?? null,
    longitude: coordenadas?.lng ?? null,
    lider_id: perfil.id,
  });

  if (error) {
    redirect("/celulas/nova?erro=1");
  }

  redirect("/celulas");
}