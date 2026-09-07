"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { MAX_DESCRICAO_EVENTO, paraDatetimeLocal } from "@/lib/midia";
import { atualizarEvento, criarEvento } from "./actions";

const campo =
  "w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground";

type EventoEdicao = {
  id: string;
  nome: string;
  descricao: string | null;
  publicar_em: string;
  exige_inscricao: boolean;
  valor_centavos: number;
};

function CamposEvento({
  pendente,
  evento,
  imagemObrigatoria,
}: {
  pendente: boolean;
  evento?: EventoEdicao;
  imagemObrigatoria: boolean;
}) {
  const [comInscricao, setComInscricao] = useState(
    evento?.exige_inscricao ?? false
  );

  return (
    <>
      <div>
        <label htmlFor="nome" className="mb-1.5 block text-sm font-medium">
          Nome do evento
        </label>
        <input
          id="nome"
          name="nome"
          required
          defaultValue={evento?.nome}
          disabled={pendente}
          placeholder="Culto de jovens, conferência..."
          className={campo}
        />
      </div>
      <div>
        <label htmlFor="descricao" className="mb-1.5 block text-sm font-medium">
          Descrição
        </label>
        <textarea
          id="descricao"
          name="descricao"
          rows={4}
          maxLength={MAX_DESCRICAO_EVENTO}
          defaultValue={evento?.descricao ?? ""}
          disabled={pendente}
          placeholder="Data, horário, local, o que vai rolar..."
          className={campo}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Até {MAX_DESCRICAO_EVENTO} caracteres. Aparece na página de Eventos.
        </p>
      </div>
      <div>
        <p className="mb-1.5 text-sm font-medium">Este evento precisa de inscrição?</p>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="exige_inscricao"
              value="sim"
              checked={comInscricao}
              onChange={() => setComInscricao(true)}
              disabled={pendente}
            />
            Sim, tem inscrição
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="exige_inscricao"
              value="nao"
              checked={!comInscricao}
              onChange={() => setComInscricao(false)}
              disabled={pendente}
            />
            Não, só o post
          </label>
        </div>
      </div>
      {comInscricao && (
        <div>
          <label htmlFor="valor_reais" className="mb-1.5 block text-sm font-medium">
            Valor da inscrição (R$)
          </label>
          <input
            id="valor_reais"
            name="valor_reais"
            type="text"
            inputMode="decimal"
            required
            defaultValue={
              evento?.valor_centavos
                ? (evento.valor_centavos / 100).toFixed(2).replace(".", ",")
                : ""
            }
            disabled={pendente}
            placeholder="50,00"
            className={campo}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Quem se inscrever paga esse valor. Tesouraria, Apóstolo e Dev
            conferem no painel.
          </p>
        </div>
      )}
      <div>
        <label htmlFor="publicar_em" className="mb-1.5 block text-sm font-medium">
          Programar publicação
        </label>
        <input
          id="publicar_em"
          name="publicar_em"
          type="datetime-local"
          defaultValue={
            evento?.publicar_em ? paraDatetimeLocal(evento.publicar_em) : ""
          }
          disabled={pendente}
          className={campo}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Vazio = publica agora. No futuro = o post só aparece no site nessa
          data e hora.
        </p>
      </div>
      <div>
        <label htmlFor="imagem" className="mb-1.5 block text-sm font-medium">
          Imagem do post
        </label>
        <input
          id="imagem"
          name="imagem"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          required={imagemObrigatoria}
          disabled={pendente}
          className="w-full border border-border bg-background px-3 py-2.5 text-sm file:mr-3 file:border-0 file:bg-foreground file:px-3 file:py-1.5 file:text-sm file:text-background"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          PNG, JPG ou WebP, até 5 MB.
          {!imagemObrigatoria ? " Deixe em branco para manter a imagem atual." : ""}
        </p>
      </div>
    </>
  );
}

export function FormEvento() {
  const [estado, action, pendente] = useActionState(
    async (_prev: { erro?: string; ok?: boolean } | null, formData: FormData) => {
      return criarEvento(formData);
    },
    null
  );

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <CamposEvento pendente={pendente} imagemObrigatoria />
      {estado?.erro && <p className="text-sm text-destructive">{estado.erro}</p>}
      {estado?.ok && (
        <p className="text-sm text-muted-foreground">Evento salvo.</p>
      )}
      <Button type="submit" disabled={pendente} className="rounded-full">
        {pendente ? "Salvando..." : "Salvar evento"}
      </Button>
    </form>
  );
}

export function FormEditarEvento({ evento }: { evento: EventoEdicao }) {
  const [estado, action, pendente] = useActionState(
    async (_prev: { erro?: string; ok?: boolean } | null, formData: FormData) => {
      return atualizarEvento(evento.id, formData);
    },
    null
  );

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <CamposEvento
        pendente={pendente}
        evento={evento}
        imagemObrigatoria={false}
      />
      {estado?.erro && <p className="text-sm text-destructive">{estado.erro}</p>}
      {estado?.ok && (
        <p className="text-sm text-muted-foreground">Alterações salvas.</p>
      )}
      <Button type="submit" disabled={pendente} className="rounded-full">
        {pendente ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}
