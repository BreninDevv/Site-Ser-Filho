"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function BarraExclusaoTesouraria({
  total,
  idsVisiveis,
  modoSelecao,
  onModoSelecao,
  selecionados,
  onSelecionados,
  onApagarSelecionadas,
  onApagarTodas,
}: {
  total: number;
  idsVisiveis: string[];
  modoSelecao: boolean;
  onModoSelecao: (ativo: boolean) => void;
  selecionados: string[];
  onSelecionados: (ids: string[]) => void;
  onApagarSelecionadas: (ids: string[]) => Promise<void>;
  onApagarTodas: () => Promise<void>;
}) {
  const qtd = selecionados.length;

  function sairDaSelecao() {
    onModoSelecao(false);
    onSelecionados([]);
  }

  if (total === 0) return null;

  return (
    <div className="flex flex-col gap-2 border border-border p-3 sm:flex-row sm:flex-wrap sm:items-center">
      <p className="text-sm font-semibold">Tesouraria</p>
      {!modoSelecao ? (
        <>
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={() => onModoSelecao(true)}
          >
            Selecionar para apagar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost" className="text-destructive">
                Apagar todas
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Apagar as {total} inscrições deste painel?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Isso remove todo mundo da lista, inclusive comprovantes. Não
                  dá para desfazer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Voltar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  onClick={() => onApagarTodas()}
                >
                  Apagar todas mesmo assim
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : (
        <>
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={() => onSelecionados(idsVisiveis)}
          >
            Marcar as visíveis ({idsVisiveis.length})
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost" className="text-destructive" disabled={qtd === 0}>
                Apagar selecionadas ({qtd})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Apagar {qtd} inscrição{qtd === 1 ? "" : "ões"} marcada
                  {qtd === 1 ? "" : "s"}?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Só as que você marcou saem da lista. Não dá para desfazer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Voltar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  onClick={async () => {
                    await onApagarSelecionadas(selecionados);
                    sairDaSelecao();
                  }}
                >
                  Apagar selecionadas
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button size="sm" variant="outline" type="button" onClick={sairDaSelecao}>
            Cancelar seleção
          </Button>
        </>
      )}
    </div>
  );
}

export function CheckboxInscricao({
  id,
  marcado,
  onChange,
}: {
  id: string;
  marcado: boolean;
  onChange: (id: string, marcado: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={marcado}
        onChange={(e) => onChange(id, e.target.checked)}
        className="size-4 accent-foreground"
      />
      Selecionar
    </label>
  );
}
