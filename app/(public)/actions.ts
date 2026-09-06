"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type LoginState = {
  error: string | null;
};

export async function login(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const senha = formData.get("senha") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) {
    return {
      error: "E-mail ou senha incorretos",
    };
  }

  redirect("/home");
}