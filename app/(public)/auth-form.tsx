"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { login } from "./actions";

export function AuthForm() {
  const [state, formAction, isPending] = useActionState(login, {
    error: null,
  });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          E-mail
        </label>

        <input
          name="email"
          type="email"
          required
          placeholder="seu@email.com"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition disabled:opacity-50"
          disabled={isPending}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Senha
        </label>

        <input
          name="senha"
          type="password"
          required
          placeholder="Sua senha"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition disabled:opacity-50"
          disabled={isPending}
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 mt-1">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-blue-600 text-white hover:bg-blue-700 py-3 text-sm font-medium rounded-lg transition disabled:opacity-50"
      >
        {isPending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}