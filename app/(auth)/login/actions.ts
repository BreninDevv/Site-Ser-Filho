"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { COOKIE_VISITANTE } from "@/lib/auth/visitante";
import { createClient } from "@/lib/supabase/server";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_VISITANTE);
  redirect("/login");
}
