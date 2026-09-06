"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { criarCelula } from "./actions";

export function NovaCelulaForm({ erro }: { erro?: string }) {
  const [enviando, setEnviando] = useState(false);
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setErroLocal(null);

    const formData = new FormData(e.currentTarget);
    const foto = formData.get("foto") as File | null;
    let fotoUrl: string | null = null;

    if (foto && foto.size > 0) {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErroLocal("Sua sessão expirou. Faça login novamente.");
        setEnviando(false);
        return;
      }

      const extensao = foto.name.split(".").pop();
      const nomeArquivo = `${user.id}/${Date.now()}.${extensao}`;

      const { error: erroUpload } = await supabase.storage
        .from("celulas-fotos")
        .upload(nomeArquivo, foto);

      if (erroUpload) {
        setErroLocal("Não foi possível enviar a foto. Tente novamente.");
        setEnviando(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("celulas-fotos")
        .getPublicUrl(nomeArquivo);

      fotoUrl = urlData.publicUrl;
    }

    await criarCelula({
      nome: formData.get("nome") as string,
      endereco: formData.get("endereco") as string,
      dia: formData.get("dia") as string,
      horario: formData.get("horario") as string,
      descricao: formData.get("descricao") as string,
      nome_responsavel: formData.get("nome_responsavel") as string,
      foto_url: fotoUrl,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {(erro || erroLocal) && (
        <p className="text-sm text-destructive">
          {erroLocal ?? "Não foi possível salvar. Verifique os dados e tente de novo."}
        </p>
      )}

      <div>
        <label className="block text-sm font-medium mb-1.5">Foto da célula</label>
        <input
          name="foto"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={enviando}
          className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none file:mr-3 file:border-0 file:bg-foreground file:px-3 file:py-1.5 file:text-background file:text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">Opcional. PNG, JPG ou WebP.</p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5">Seu nome</label>
        <input
          name="nome_responsavel"
          required
          disabled={enviando}
          placeholder="Nome do líder ou pastor responsável"
          className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5">Nome da célula</label>
        <input
          name="nome"
          required
          disabled={enviando}
          className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5">Endereço</label>
        <input
          name="endereco"
          required
          disabled={enviando}
          className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5">Dia da semana</label>
        <input
          name="dia"
          required
          disabled={enviando}
          placeholder="Ex: Quinta-feira"
          className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5">Horário</label>
        <input
          name="horario"
          required
          disabled={enviando}
          placeholder="Ex: 20:00"
          className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5">Informações adicionais</label>
        <textarea
          name="descricao"
          rows={3}
          disabled={enviando}
          className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
        />
      </div>
      <button
        type="submit"
        disabled={enviando}
        className="w-full bg-foreground text-background py-2.5 text-sm font-semibold hover:bg-foreground/90 disabled:opacity-60"
      >
        {enviando ? "Salvando..." : "Salvar célula"}
      </button>
    </form>
  );
}