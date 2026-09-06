"use client";

import { useActionState } from "react";
import { buscarCelulasPorDistancia } from "./actions";
import { Button } from "@/components/ui/button";

function formatarDistancia(km: number): string {
  if (km < 0.001) return "menos de 1 m";
  if (km < 1) return `${(km * 1000).toFixed(0)} m`;
  return `${km.toFixed(1)} km`;
}

export function BuscaDistanciaForm() {
  const [state, formAction, isPending] = useActionState(
    buscarCelulasPorDistancia,
    { celulas: [], error: null }
  );

  return (
    <div className="mb-8">
      <form action={formAction} className="flex flex-col sm:flex-row gap-3">
        <input
          name="endereco"
          type="text"
          placeholder="Digite seu endereço ou bairro..."
          className="flex-1 border border-border bg-background px-4 py-2 text-sm outline-none focus:border-foreground disabled:opacity-50"
          disabled={isPending}
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Buscando..." : "Buscar perto de mim"}
        </Button>
      </form>

      {isPending && (
        <p className="mt-4 text-sm text-muted-foreground">
          Buscando células perto de você...
        </p>
      )}

      {state.error && !isPending && (
        <p className="mt-4 text-sm text-destructive">{state.error}</p>
      )}

      {state.celulas !== null && !isPending && (
        <div className="mt-6">
          {state.celulas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma célula com localização encontrada perto de você.
            </p>
          ) : (
            <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2">
              {state.celulas.map((c: any) => (
                <div key={c.id} className="flex flex-col bg-background">
                  <div className="aspect-video w-full bg-muted flex items-center justify-center">
                    {c.foto_url ? (
                      <img
                        src={c.foto_url}
                        alt={c.nome}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        className="h-8 w-8 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="1" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 p-6">
                    <h2 className="text-lg font-bold">{c.nome}</h2>
                    <p className="text-sm text-muted-foreground">
                      {c.endereco}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {c.dia} · {c.horario}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {formatarDistancia(c.distanciaKm)} de distância
                    </p>
                    {c.descricao && <p className="text-sm">{c.descricao}</p>}
                    {c.nome_responsavel && (
                      <p className="text-xs font-medium text-muted-foreground">
                        Responsável: {c.nome_responsavel}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}