"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { ROTULOS_ROLE } from "@/lib/auth/roles";
import { aprovarSolicitacao, recusarSolicitacao } from "./actions";

export type ItemSolicitacao = {
  id: string;
  usuario_nome: string;
  usuario_role: string;
  usuario_equipe: string | null;
  role_nova: string | null;
  equipe_nova: string | null;
  motivo: string;
  created_at: string;
};

export function ItemSolicitacaoPerfil({ item }: { item: ItemSolicitacao }) {
  const [pendente, start] = useTransition();
  const [erro, setErro] = useState("");

  function revisar(aprovar: boolean) {
    setErro("");
    start(async () => {
      const res = aprovar
        ? await aprovarSolicitacao(item.id)
        : await recusarSolicitacao(item.id);
      if (res?.erro) setErro(res.erro);
    });
  }

  const quando = new Date(item.created_at).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });

  return (
    <li className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{item.usuario_nome}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Hoje: {ROTULOS_ROLE[item.usuario_role] ?? item.usuario_role}
            {item.usuario_equipe ? ` · ${item.usuario_equipe}` : " · sem equipe"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Pedido em {quando}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            size="sm"
            className="rounded-full"
            disabled={pendente}
            onClick={() => revisar(true)}
          >
            {pendente ? "..." : "Aprovar"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={pendente}
            onClick={() => revisar(false)}
          >
            Recusar
          </Button>
        </div>
      </div>

      <ul className="list-inside list-disc text-sm text-muted-foreground">
        {item.role_nova ? (
          <li>
            Quer ser:{" "}
            <strong className="text-foreground">
              {ROTULOS_ROLE[item.role_nova] ?? item.role_nova}
            </strong>
          </li>
        ) : null}
        {item.equipe_nova ? (
          <li>
            Quer a equipe:{" "}
            <strong className="text-foreground">{item.equipe_nova}</strong>
          </li>
        ) : null}
      </ul>

      {item.motivo ? (
        <p className="text-sm text-muted-foreground">Motivo: {item.motivo}</p>
      ) : null}
      {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
    </li>
  );
}
