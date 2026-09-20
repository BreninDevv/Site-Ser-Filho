"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ROTULOS_ROLE } from "@/lib/auth/roles";
import {
  criarKitPerfisFicticios,
  criarPerfilFicticio,
} from "@/app/(painel)/painel/admin/usuarios/actions";
import type { CredencialFicticia } from "@/app/(painel)/painel/admin/usuarios/tipos";

const ROLES_FORM = [
  "discipulo",
  "pendente",
  "lider",
  "lider_tesouraria",
  "pastor",
  "midia",
  "tesouraria",
  "apostolo",
] as const;

export function CriarPerfilFicticioDev() {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [criados, setCriados] = useState<CredencialFicticia[]>([]);
  const [role, setRole] = useState<string>("pastor");

  return (
    <section className="space-y-4 rounded-lg border border-dashed border-border p-4">
      <div>
        <h2 className="text-sm font-medium">Perfis fictícios (só Dev)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cria contas de teste já confirmadas, com senha padrão{" "}
          <code className="text-xs">TesteSerFilho1!</code>, para exercitar o
          painel sem depender de cadastro real. Nome recebe o prefixo{" "}
          <strong>[TESTE]</strong>.
        </p>
      </div>

      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const data = new FormData(form);
          setErro(null);
          startTransition(async () => {
            const resultado = await criarPerfilFicticio(data);
            if (!resultado.ok) {
              setErro(resultado.mensagem);
              return;
            }
            setCriados((lista) => [resultado.credencial, ...lista]);
            form.reset();
            setRole("pastor");
          });
        }}
      >
        <label className="grid gap-1 text-sm sm:col-span-1">
          <span className="text-muted-foreground">Nome</span>
          <input
            name="nome"
            required
            minLength={2}
            maxLength={80}
            placeholder="Ex.: Pastor Teste"
            className="border border-border bg-background px-3 py-2 outline-none focus:border-foreground"
            disabled={pending}
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">Função</span>
          <select
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="border border-border bg-background px-3 py-2 outline-none focus:border-foreground"
            disabled={pending}
          >
            {ROLES_FORM.map((r) => (
              <option key={r} value={r}>
                {ROTULOS_ROLE[r] ?? r}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">E-mail (opcional)</span>
          <input
            name="email"
            type="email"
            placeholder="Deixe vazio para gerar automático"
            className="border border-border bg-background px-3 py-2 outline-none focus:border-foreground"
            disabled={pending}
          />
        </label>

        {role === "pastor" ? (
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Equipe pastoral</span>
            <input
              name="equipe_nome"
              defaultValue="Equipe Teste"
              maxLength={80}
              className="border border-border bg-background px-3 py-2 outline-none focus:border-foreground"
              disabled={pending}
            />
          </label>
        ) : (
          <div className="hidden sm:block" />
        )}

        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Criando…" : "Criar perfil fictício"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => {
              setErro(null);
              startTransition(async () => {
                const resultado = await criarKitPerfisFicticios();
                if (!resultado.ok) {
                  setErro(resultado.mensagem);
                  return;
                }
                setCriados((lista) => [...resultado.credenciais, ...lista]);
              });
            }}
          >
            Criar kit completo (todas as funções)
          </Button>
        </div>
      </form>

      {erro ? <p className="text-sm text-destructive">{erro}</p> : null}

      {criados.length > 0 ? (
        <div className="space-y-2 border border-border bg-muted/30 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Credenciais geradas nesta sessão (copie agora)
          </p>
          <ul className="space-y-2 text-sm">
            {criados.map((c) => (
              <li
                key={c.id}
                className="rounded border border-border bg-background px-3 py-2"
              >
                <span className="font-medium">{c.nome}</span>{" "}
                <span className="text-muted-foreground">
                  ({ROTULOS_ROLE[c.role] ?? c.role})
                </span>
                <div className="mt-1 font-mono text-xs break-all">
                  {c.email} · senha: {c.senha}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
