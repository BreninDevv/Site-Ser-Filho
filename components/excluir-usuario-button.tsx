"use client";

import { useState, useTransition } from "react";
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
import { excluirUsuario } from "@/app/(painel)/painel/admin/usuarios/actions";

export function ExcluirUsuarioButton({
  userId,
  nome,
}: {
  userId: string;
  nome: string;
}) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            type="button"
            variant="ghost"
            className="text-destructive"
            disabled={pending}
          >
            Excluir
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {nome}?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso apaga a conta e o perfil permanentemente. A pessoa não
              consegue mais entrar no site. Não tem como desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={pending}
              onClick={() => {
                setErro(null);
                startTransition(async () => {
                  const resultado = await excluirUsuario(userId);
                  if (!resultado.ok) setErro(resultado.mensagem);
                });
              }}
            >
              Excluir mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {erro ? <p className="text-xs text-destructive">{erro}</p> : null}
    </div>
  );
}
