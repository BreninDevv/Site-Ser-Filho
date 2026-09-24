"use client";

import { useActionState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  ROLES_CADASTRO,
  ROTULOS_ROLE_CADASTRO,
  ROTULOS_SEXO_CADASTRO,
  SEXOS_CADASTRO,
  TEMPOS_IGREJA,
  type RoleCadastro,
} from "@/lib/validations/cadastro";
import { ROTULOS_ROLE } from "@/lib/auth/roles";
import {
  atualizarDadosBasicos,
  cancelarSolicitacaoPendente,
  solicitarEquipeOuFuncao,
} from "./actions";

const campo =
  "w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground";

export type PerfilFormDados = {
  nome: string;
  role: string;
  tempo_igreja: string | null;
  sexo: string | null;
  equipe_id: string | null;
  equipe_nome: string | null;
};

export type SolicitacaoPendente = {
  id: string;
  role_nova: string | null;
  equipe_id_nova: string | null;
  equipe_nome: string | null;
  motivo: string;
  created_at: string;
};

export function FormPerfil({
  perfil,
  equipes,
  pendente,
}: {
  perfil: PerfilFormDados;
  equipes: { id: string; nome: string }[];
  pendente: SolicitacaoPendente | null;
}) {
  const [estadoBasico, actionBasico, salvandoBasico] = useActionState(
    async (
      _prev: { erro?: string; ok?: boolean } | null,
      formData: FormData
    ) => atualizarDadosBasicos(formData),
    null
  );

  const [estadoPedido, actionPedido, enviandoPedido] = useActionState(
    async (
      _prev: { erro?: string; ok?: boolean } | null,
      formData: FormData
    ) => solicitarEquipeOuFuncao(formData),
    null
  );

  const [cancelando, startCancelar] = useTransition();

  const roleAtualRotulo =
    ROTULOS_ROLE[perfil.role] ??
    ROTULOS_ROLE_CADASTRO[perfil.role as RoleCadastro] ??
    perfil.role;

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div>
          <h2 className="text-base font-semibold">Dados básicos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Nome, sexo e tempo de igreja salvam na hora.
          </p>
        </div>
        <form action={actionBasico} className="space-y-4">
          <div>
            <label htmlFor="nome" className="mb-1.5 block text-sm font-medium">
              Nome
            </label>
            <input
              id="nome"
              name="nome"
              required
              defaultValue={perfil.nome}
              disabled={salvandoBasico}
              className={campo}
            />
          </div>
          <div>
            <label htmlFor="sexo" className="mb-1.5 block text-sm font-medium">
              Sexo
            </label>
            <select
              id="sexo"
              name="sexo"
              required
              defaultValue={
                perfil.sexo === "mulher" ? "feminino" : (perfil.sexo ?? "")
              }
              disabled={salvandoBasico}
              className={campo}
            >
              <option value="">Selecione</option>
              {SEXOS_CADASTRO.map((opcao) => (
                <option key={opcao} value={opcao}>
                  {ROTULOS_SEXO_CADASTRO[opcao]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="tempo_igreja"
              className="mb-1.5 block text-sm font-medium"
            >
              Tempo de igreja
            </label>
            <select
              id="tempo_igreja"
              name="tempo_igreja"
              required
              defaultValue={perfil.tempo_igreja ?? ""}
              disabled={salvandoBasico}
              className={campo}
            >
              <option value="">Selecione</option>
              {TEMPOS_IGREJA.map((tempo) => (
                <option key={tempo} value={tempo}>
                  {tempo}
                </option>
              ))}
            </select>
          </div>
          {estadoBasico?.erro ? (
            <p className="text-sm text-destructive">{estadoBasico.erro}</p>
          ) : null}
          {estadoBasico?.ok ? (
            <p className="text-sm text-emerald-700">Dados salvos.</p>
          ) : null}
          <Button
            type="submit"
            disabled={salvandoBasico}
            className="rounded-full"
          >
            {salvandoBasico ? "Salvando..." : "Salvar dados básicos"}
          </Button>
        </form>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div>
          <h2 className="text-base font-semibold">Função e equipe</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Mudanças de função ou equipe precisam da aprovação de um pastor,
            apóstolo ou Dev.
          </p>
          <p className="mt-2 text-sm">
            Agora: <strong>{roleAtualRotulo}</strong>
            {perfil.equipe_nome
              ? ` · equipe ${perfil.equipe_nome}`
              : " · sem equipe pastoral"}
          </p>
        </div>

        {pendente ? (
          <div className="space-y-3 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
            <p className="font-medium text-amber-900 dark:text-amber-200">
              Pedido aguardando aprovação
            </p>
            <ul className="list-inside list-disc text-muted-foreground">
              {pendente.role_nova ? (
                <li>
                  Função:{" "}
                  {ROTULOS_ROLE_CADASTRO[
                    pendente.role_nova as RoleCadastro
                  ] ?? pendente.role_nova}
                </li>
              ) : null}
              {pendente.equipe_id_nova ? (
                <li>
                  Equipe: {pendente.equipe_nome ?? "equipe selecionada"}
                </li>
              ) : null}
            </ul>
            {pendente.motivo ? (
              <p className="text-muted-foreground">Motivo: {pendente.motivo}</p>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full"
              disabled={cancelando}
              onClick={() => {
                startCancelar(() => {
                  void cancelarSolicitacaoPendente();
                });
              }}
            >
              {cancelando ? "Cancelando..." : "Cancelar pedido"}
            </Button>
          </div>
        ) : (
          <form action={actionPedido} className="space-y-4">
            <div>
              <label
                htmlFor="role_nova"
                className="mb-1.5 block text-sm font-medium"
              >
                Nova função{" "}
                <span className="font-normal text-muted-foreground">
                  (opcional)
                </span>
              </label>
              <select
                id="role_nova"
                name="role_nova"
                defaultValue=""
                disabled={enviandoPedido}
                className={campo}
              >
                <option value="">Manter {roleAtualRotulo}</option>
                {ROLES_CADASTRO.map((role) => (
                  <option key={role} value={role}>
                    {ROTULOS_ROLE_CADASTRO[role]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="equipe_id_nova"
                className="mb-1.5 block text-sm font-medium"
              >
                Nova equipe pastoral{" "}
                <span className="font-normal text-muted-foreground">
                  (opcional)
                </span>
              </label>
              <select
                id="equipe_id_nova"
                name="equipe_id_nova"
                defaultValue=""
                disabled={enviandoPedido}
                className={campo}
              >
                <option value="">
                  {perfil.equipe_nome
                    ? `Manter ${perfil.equipe_nome}`
                    : "Sem equipe (escolha uma para pedir)"}
                </option>
                {equipes.map((equipe) => (
                  <option key={equipe.id} value={equipe.id}>
                    {equipe.nome}
                  </option>
                ))}
              </select>
              {equipes.length === 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Ainda não há equipes cadastradas. O pastor cria a equipe no
                  cadastro.
                </p>
              ) : null}
            </div>
            <div>
              <label
                htmlFor="motivo"
                className="mb-1.5 block text-sm font-medium"
              >
                Motivo{" "}
                <span className="font-normal text-muted-foreground">
                  (opcional)
                </span>
              </label>
              <textarea
                id="motivo"
                name="motivo"
                rows={3}
                maxLength={280}
                disabled={enviandoPedido}
                placeholder="Ex.: entrei na equipe do pastor Fulano"
                className={campo}
              />
            </div>
            {estadoPedido?.erro ? (
              <p className="text-sm text-destructive">{estadoPedido.erro}</p>
            ) : null}
            {estadoPedido?.ok ? (
              <p className="text-sm text-emerald-700">
                Pedido enviado. Aguarde a aprovação.
              </p>
            ) : null}
            <Button
              type="submit"
              disabled={enviandoPedido}
              className="rounded-full"
            >
              {enviandoPedido ? "Enviando..." : "Pedir aprovação"}
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}
