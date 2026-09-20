"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  MAX_DESCRICAO_TESTEMUNHO,
  previaEhVideo,
  urlPublicaDaPrevia,
} from "@/lib/midia";
import { editarTestemunho, excluirTestemunho } from "./actions";

const campo =
  "w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground";

export type ItemTestemunhoDados = {
  id: string;
  nome: string | null;
  titulo: string | null;
  descricao: string | null;
  video_url: string | null;
  previa_path: string | null;
};

export function ItemTestemunho({ item }: { item: ItemTestemunhoDados }) {
  const [editando, setEditando] = useState(false);
  const [estado, action, pendente] = useActionState(
    async (_prev: { erro?: string; ok?: boolean } | null, formData: FormData) => {
      return editarTestemunho(formData);
    },
    null
  );

  useEffect(() => {
    if (estado?.ok) setEditando(false);
  }, [estado]);

  const previa = item.previa_path ? urlPublicaDaPrevia(item.previa_path) : "";
  const titulo = item.nome || item.titulo || "Sem título";

  if (editando) {
    return (
      <li className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <form action={action} className="space-y-3">
          <input type="hidden" name="id" value={item.id} />
          <div>
            <label className="mb-1 block text-xs font-medium">Nome / título</label>
            <input
              name="nome"
              required
              defaultValue={titulo}
              disabled={pendente}
              className={campo}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Descrição</label>
            <textarea
              name="descricao"
              required
              rows={3}
              maxLength={MAX_DESCRICAO_TESTEMUNHO}
              defaultValue={item.descricao ?? ""}
              disabled={pendente}
              className={campo}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Link</label>
            <input
              name="video_url"
              type="url"
              required
              defaultValue={item.video_url ?? ""}
              disabled={pendente}
              className={campo}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">
              Nova prévia{" "}
              <span className="font-normal text-muted-foreground">
                (opcional)
              </span>
            </label>
            <input
              name="previa"
              type="file"
              disabled={pendente}
              accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
              className={campo}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Instagram: se trocar o link, envie uma prévia nova. Shorts: pode
              deixar em branco.
            </p>
          </div>
          {estado?.erro ? (
            <p className="text-sm text-destructive">{estado.erro}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={pendente} className="rounded-full">
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
        {previa ? (
          <div className="h-24 w-14 shrink-0 overflow-hidden rounded-md bg-black">
            {item.previa_path && previaEhVideo(item.previa_path) ? (
              <video src={previa} muted className="h-full w-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previa} alt="" className="h-full w-full object-cover" />
            )}
          </div>
        ) : null}
        <div className="min-w-0">
          <p className="text-sm font-semibold">{titulo}</p>
          {item.descricao ? (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {item.descricao}
            </p>
          ) : null}
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {item.video_url}
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
        <form action={excluirTestemunho.bind(null, item.id)}>
          <Button size="sm" variant="destructive" type="submit" className="rounded-full">
            Remover
          </Button>
        </form>
      </div>
    </li>
  );
}
