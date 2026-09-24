"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { previaEhVideo, urlPublicaUnicasMidia } from "@/lib/midia";
import { enviarUnicasMidiaNoCliente } from "@/lib/unicas-midia-upload-cliente";
import { editarMidiaUnicas, excluirMidiaUnicas } from "./actions";

const campo =
  "w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground";

export type ItemMidiaUnicasDados = {
  id: string;
  titulo: string;
  subtitulo: string;
  arquivo_path: string;
  tipo: string;
  ordem: number;
};

export function ItemMidiaUnicas({ item }: { item: ItemMidiaUnicasDados }) {
  const [editando, setEditando] = useState(false);
  const [excluindo, startExcluir] = useTransition();
  const [estado, action, pendente] = useActionState(
    async (
      _prev: { erro?: string; ok?: boolean } | null,
      formData: FormData
    ) => {
      try {
        const arquivo = formData.get("arquivo");
        if (arquivo instanceof File && arquivo.size > 0) {
          const up = await enviarUnicasMidiaNoCliente(arquivo);
          if ("erro" in up) return { erro: up.erro };
          formData.set("arquivo_path", up.caminho);
          formData.set("tipo", up.tipo);
          formData.delete("arquivo");
        }
        return await editarMidiaUnicas(formData);
      } catch {
        return { erro: "Falha ao salvar. Tente de novo." };
      }
    },
    null
  );

  useEffect(() => {
    if (estado?.ok) setEditando(false);
  }, [estado]);

  const url = urlPublicaUnicasMidia(item.arquivo_path);
  const ehVideo = item.tipo === "video" || previaEhVideo(item.arquivo_path);

  if (editando) {
    return (
      <li className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <form action={action} className="space-y-3">
          <input type="hidden" name="id" value={item.id} />
          <div>
            <label className="mb-1 block text-xs font-medium">Título</label>
            <input
              name="titulo"
              required
              defaultValue={item.titulo}
              disabled={pendente}
              className={campo}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Legenda</label>
            <input
              name="subtitulo"
              maxLength={160}
              defaultValue={item.subtitulo}
              disabled={pendente}
              className={campo}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Ordem</label>
            <input
              name="ordem"
              type="number"
              min={0}
              max={999}
              defaultValue={item.ordem}
              disabled={pendente}
              className={campo}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">
              Novo arquivo{" "}
              <span className="font-normal text-muted-foreground">
                (opcional)
              </span>
            </label>
            <input
              name="arquivo"
              type="file"
              disabled={pendente}
              accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
              className={campo}
            />
          </div>
          {estado?.erro ? (
            <p className="text-sm text-destructive">{estado.erro}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              size="sm"
              disabled={pendente}
              className="rounded-full"
            >
              {pendente ? "Salvando..." : "Salvar"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pendente}
              className="rounded-full"
              onClick={() => setEditando(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-start justify-between gap-4 rounded-2xl border border-border p-4">
      <div className="flex min-w-0 gap-3">
        {url ? (
          <div className="h-20 w-14 shrink-0 overflow-hidden rounded-md bg-black">
            {ehVideo ? (
              <video src={url} muted className="h-full w-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="h-full w-full object-cover" />
            )}
          </div>
        ) : null}
        <div className="min-w-0">
          <p className="text-sm font-semibold">{item.titulo}</p>
          {item.subtitulo ? (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {item.subtitulo}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground">
            {ehVideo ? "Vídeo" : "Foto"} · ordem {item.ordem}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
        <Button
          size="sm"
          variant="outline"
          type="button"
          className="rounded-full"
          onClick={() => setEditando(true)}
        >
          Editar
        </Button>
        <Button
          size="sm"
          variant="destructive"
          type="button"
          className="rounded-full"
          disabled={excluindo}
          onClick={() => {
            if (!confirm("Remover este item da galeria Únicas?")) return;
            startExcluir(() => {
              void excluirMidiaUnicas(item.id);
            });
          }}
        >
          {excluindo ? "..." : "Remover"}
        </Button>
      </div>
    </li>
  );
}
