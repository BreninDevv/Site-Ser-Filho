"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { atualizarCelula } from "../../actions";

type Celula = {
  id: string;
  nome: string;
  endereco: string;
  dia: string;
  horario: string;
  descricao: string | null;
  nome_responsavel: string | null;
  foto_url: string | null;
};

export function EditarCelulaForm({ celula, erro }: { celula: Celula; erro?: string }) {
  const [enviando, setEnviando] = useState(false);
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setErroLocal(null);

    const formData = new FormData(e.currentTarget);
    const foto = formData.get("foto") as File | null;
    let fotoUrl: string | undefined = undefined;

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

    await atualizarCelula(celula.id, {
      nome: formData.get("nome") as string,
      endereco: formData.get("endereco") as string,
      dia: formData.get("dia") as string,
      horario: formData.get("horario") as string,
      descricao: formData.get("descricao") as string,
      nome_responsavel: formData.get("nome_responsavel") as string,
      ...(fotoUrl ? { foto_url: fotoUrl } : {}),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {(erro || erroLocal) && (
        <p className="text-sm text-destructive">
          {erroLocal ?? "Não foi possível salvar. Tente de novo."}
        </p>
      )}

      <div>
        <label className="block text-sm font-medium mb-1.5">Foto da célula</label>
        {celula.foto_url && (
          <img
            src={celula.foto_url}
            alt={celula.nome}
            className="mb-3 h-40 w-full object-cover border border-border"
          />
        )}
        <input
          name="foto"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={enviando}
          className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none file:mr-3 file:border-0 file:bg-foreground file:px-3 file:py-1.5 file:text-background file:text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {celula.foto_url ? "Deixe em branco para manter a foto atual." : "Opcional. PNG, JPG ou WebP."}
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5">Seu nome</label>
        <input
          name="nome_responsavel"
          defaultValue={celula.nome_responsavel ?? ""}
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
          defaultValue={celula.nome}
          required
          disabled={enviando}
          className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5">Endereço</label>
        <input
          name="endereco"
          defaultValue={celula.endereco}
          required
          disabled={enviando}
          className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5">Dia da semana</label>
        <input
          name="dia"
          defaultValue={celula.dia}
          required
          disabled={enviando}
          className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5">Horário</label>
        <input
          name="horario"
          defaultValue={celula.horario}
          required
          disabled={enviando}
          className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5">Informações adicionais</label>
        <textarea
          name="descricao"
          defaultValue={celula.descricao ?? ""}
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
        {enviando ? "Salvando..." : "Salvar alterações"}
      </button>
    </form>
  );
}