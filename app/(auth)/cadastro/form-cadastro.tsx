"use client";

import { useState } from "react";
import {
  ROLES_CADASTRO,
  ROTULOS_ROLE_CADASTRO,
  TEMPOS_IGREJA,
  precisaEscolherEquipe,
  type RoleCadastro,
} from "@/lib/validations/cadastro";
import { SENHA_MINIMA, SENHA_PADRAO, TEXTO_SENHA } from "@/lib/senha";
import { cadastrar } from "./actions";

const campo =
  "w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground";

export function FormCadastro({
  equipes,
}: {
  equipes: { id: string; nome: string }[];
}) {
  const [funcao, setFuncao] = useState<RoleCadastro | "">("");

  return (
    <form action={cadastrar} className="space-y-4">
      <div>
        <label htmlFor="nome" className="mb-1 block text-sm">
          Nome
        </label>
        <input id="nome" name="nome" required className={campo} />
      </div>

      <div>
        <label htmlFor="funcao" className="mb-1 block text-sm">
          1. Você é?
        </label>
        <select
          id="funcao"
          name="funcao"
          required
          value={funcao}
          onChange={(e) => setFuncao(e.target.value as RoleCadastro | "")}
          className={campo}
        >
          <option value="">Selecione</option>
          {ROLES_CADASTRO.map((role) => (
            <option key={role} value={role}>
              {ROTULOS_ROLE_CADASTRO[role]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor={funcao === "pastor" ? "equipe_nome" : "equipe_id"}
          className="mb-1 block text-sm"
        >
          2. Qual é a sua equipe pastoral?
        </label>
        {funcao === "pastor" ? (
          <>
            <input
              id="equipe_nome"
              name="equipe_nome"
              required
              maxLength={80}
              placeholder="Nome da sua equipe"
              className={campo}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Esse nome vai aparecer para discípulos e líderes na hora de se
              cadastrar.
            </p>
          </>
        ) : (
          <>
            <select
              id="equipe_id"
              name="equipe_id"
              required={precisaEscolherEquipe(funcao) && equipes.length > 0}
              disabled={!funcao}
              className={campo}
            >
              <option value="">
                {!funcao
                  ? "Primeiro diga quem você é"
                  : equipes.length === 0
                    ? "Ainda não há equipe cadastrada"
                    : "Selecione a equipe"}
              </option>
              {equipes.map((equipe) => (
                <option key={equipe.id} value={equipe.id}>
                  {equipe.nome}
                </option>
              ))}
            </select>
            {equipes.length === 0 && funcao && (
              <p className="mt-1 text-xs text-muted-foreground">
                O pastor cadastra o nome da equipe primeiro. Discípulo e líder
                escolhem essa equipe depois.
              </p>
            )}
          </>
        )}
      </div>

      <div>
        <label htmlFor="tempo_igreja" className="mb-1 block text-sm">
          3. Há quanto tempo você está na igreja?
        </label>
        <select id="tempo_igreja" name="tempo_igreja" required className={campo}>
          <option value="">Selecione</option>
          {TEMPOS_IGREJA.map((tempo) => (
            <option key={tempo} value={tempo}>
              {tempo}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="email" className="mb-1 block text-sm">
          E-mail
        </label>
        <input id="email" name="email" type="email" required className={campo} />
      </div>
      <div>
        <label htmlFor="senha" className="mb-1 block text-sm">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          required
          minLength={SENHA_MINIMA}
          maxLength={72}
          pattern={SENHA_PADRAO}
          title={TEXTO_SENHA}
          className={campo}
        />
        <p className="mt-1 text-xs text-muted-foreground">{TEXTO_SENHA}</p>
      </div>
      <div>
        <label htmlFor="confirmarSenha" className="mb-1 block text-sm">
          Confirmar senha
        </label>
        <input
          id="confirmarSenha"
          name="confirmarSenha"
          type="password"
          required
          minLength={SENHA_MINIMA}
          maxLength={72}
          pattern={SENHA_PADRAO}
          title={TEXTO_SENHA}
          className={campo}
        />
      </div>
      <button
        type="submit"
        className="w-full bg-foreground py-2 text-sm font-semibold text-background"
      >
        Cadastrar
      </button>
    </form>
  );
}
