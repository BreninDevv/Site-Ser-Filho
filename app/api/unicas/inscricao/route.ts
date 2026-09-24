import { NextResponse } from "next/server";

import { podeAcessarUnicas } from "@/lib/auth/unicas";
import { createClient } from "@/lib/supabase/server";

function idadeDeDataNascimento(iso: string): number | null {
  const nasc = new Date(iso + "T12:00:00");
  if (Number.isNaN(nasc.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

/**
 * Inscrição Únicas.
 * SEGURANÇA EM PROFUNDIDADE: exige usuária autenticada com
 * perfis.sexo = feminino/mulher, OU role Dev (testes).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { status: "erro", codigo: "nao_autenticado" },
      { status: 401 }
    );
  }

  const { data: perfil, error: erroPerfil } = await supabase
    .from("perfis")
    .select("role, sexo")
    .eq("id", user.id)
    .maybeSingle();

  let role = perfil?.role ?? null;
  let sexo = (perfil?.sexo as string | null | undefined) ?? null;

  if (erroPerfil && /sexo/i.test(erroPerfil.message ?? "")) {
    const { data: semSexo } = await supabase
      .from("perfis")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    role = semSexo?.role ?? null;
    sexo = null;
  }

  if (!podeAcessarUnicas({ role, sexo })) {
    return NextResponse.json(
      { status: "erro", codigo: "genero_nao_permitido" },
      { status: 403 }
    );
  }

  let corpo: {
    nome?: string;
    email?: string;
    telefone?: string;
    data_nascimento?: string;
    cidade?: string;
  };
  try {
    corpo = (await request.json()) as typeof corpo;
  } catch {
    return NextResponse.json({ status: "erro", codigo: "corpo" }, { status: 400 });
  }

  const nome = String(corpo.nome ?? "").trim();
  const email = String(corpo.email ?? "").trim().toLowerCase();
  const telefone = String(corpo.telefone ?? "").trim();
  const dataNascimento = String(corpo.data_nascimento ?? "").trim();
  const cidade = String(corpo.cidade ?? "").trim();

  const erros: Record<string, string> = {};
  if (nome.length < 2) erros.nome = "Informe seu nome.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    erros.email = "E-mail inválido.";
  }
  if (telefone.replace(/\D/g, "").length < 10) {
    erros.telefone = "Telefone inválido.";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento)) {
    erros.data_nascimento = "Informe a data de nascimento.";
  } else {
    const idade = idadeDeDataNascimento(dataNascimento);
    if (idade === null || idade < 1 || idade > 120) {
      erros.data_nascimento = "Data de nascimento inválida.";
    }
  }
  if (cidade.length < 2) erros.cidade = "Informe sua cidade.";

  if (Object.keys(erros).length > 0) {
    return NextResponse.json({ status: "erro", erros }, { status: 400 });
  }

  const idade = idadeDeDataNascimento(dataNascimento)!;

  const base = {
    nome,
    email,
    telefone,
    idade,
    sexo: "feminino" as const,
    status: "pendente" as const,
    data_nascimento: dataNascimento,
    cidade,
  };

  let { error } = await supabase.from("inscricoes_unicas").insert(base);

  if (error && /data_nascimento|cidade/i.test(error.message ?? "")) {
    const { data_nascimento: _d, cidade: _c, ...legado } = base;
    ({ error } = await supabase.from("inscricoes_unicas").insert(legado));
  }

  if (error) {
    return NextResponse.json(
      {
        status: "erro",
        codigo: "gravacao",
        mensagem:
          "Não foi possível gravar. Confira se as migrations 026, 027 e 028 rodaram no Supabase.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ status: "ok", nome });
}
