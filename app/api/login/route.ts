import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dentroDoLimite, emailValido, ipDoPedido } from "@/lib/seguranca";

export const runtime = "nodejs";

type ResultadoLogin =
  | { status: "ok" }
  | { status: "erro"; codigo: "credenciais" | "email_nao_confirmado" };

export async function POST(request: Request) {
  try {
    const corpo = (await request.json()) as { email?: string; senha?: string };
    const email = String(corpo.email ?? "").trim().toLowerCase();
    const senha = String(corpo.senha ?? "");

    if (!emailValido(email) || !senha) {
      return NextResponse.json({
        status: "erro",
        codigo: "credenciais",
      } satisfies ResultadoLogin);
    }

    const ip = await ipDoPedido();
    if (!dentroDoLimite(`login:${ip}`, 20, 15 * 60 * 1000)) {
      return NextResponse.json({
        status: "erro",
        codigo: "credenciais",
      } satisfies ResultadoLogin);
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      const codigo = error.message.toLowerCase().includes("email not confirmed")
        ? "email_nao_confirmado"
        : "credenciais";
      return NextResponse.json({ status: "erro", codigo } satisfies ResultadoLogin);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({
        status: "erro",
        codigo: "credenciais",
      } satisfies ResultadoLogin);
    }

    return NextResponse.json({ status: "ok" } satisfies ResultadoLogin);
  } catch {
    return NextResponse.json({
      status: "erro",
      codigo: "credenciais",
    } satisfies ResultadoLogin);
  }
}
