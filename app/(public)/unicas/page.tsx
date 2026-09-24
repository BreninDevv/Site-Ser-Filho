import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Cormorant_Garamond, Meow_Script, WindSong } from "next/font/google";

import { UnicasPageShell } from "@/components/unicas/unicas-page-shell";
import { podeAcessarUnicas } from "@/lib/auth/unicas";
import { createClient } from "@/lib/supabase/server";
import { previaEhVideo, urlPublicaUnicasMidia } from "@/lib/midia";

import "@/components/unicas/unicas.css";

export const metadata: Metadata = {
  title: "Únicas | Ser Filho",
  description: "Bem Aventuradas — espaço Únicas do Ministério Ser Filho.",
};

const windSong = WindSong({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-unicas-title-face",
  display: "swap",
  fallback: ["Meow Script", "cursive"],
});

const meowScript = Meow_Script({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-unicas-title-fallback",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-unicas-body-face",
  display: "swap",
});

export default async function UnicasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/unicas");
  }

  const { data: perfil, error } = await supabase
    .from("perfis")
    .select("role, sexo")
    .eq("id", user.id)
    .maybeSingle();

  let role = perfil?.role ?? null;
  let sexo = (perfil?.sexo as string | null | undefined) ?? null;

  if (error && /sexo/i.test(error.message ?? "")) {
    const { data: semSexo } = await supabase
      .from("perfis")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    role = semSexo?.role ?? null;
    sexo = null;
  }

  if (!podeAcessarUnicas({ role, sexo })) {
    redirect("/acesso-negado");
  }

  const { data: midias } = await supabase
    .from("midia_unicas")
    .select("id, titulo, subtitulo, arquivo_path, tipo")
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(12);

  const galeria = (midias ?? [])
    .map((item) => {
      const url = urlPublicaUnicasMidia(item.arquivo_path);
      if (!url) return null;
      return {
        id: item.id as string,
        titulo: (item.titulo as string) || "Únicas",
        subtitulo: (item.subtitulo as string) || "",
        url,
        video:
          item.tipo === "video" || previaEhVideo(item.arquivo_path as string),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div
      className={`pagina-unicas ${windSong.variable} ${meowScript.variable} ${cormorant.variable}`}
    >
      <UnicasPageShell galeria={galeria} />
    </div>
  );
}
