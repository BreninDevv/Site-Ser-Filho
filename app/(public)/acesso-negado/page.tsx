import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Acesso negado | Ser Filho",
  description: "Você não tem permissão para acessar esta página.",
};

export default function AcessoNegadoPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Acesso negado
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Este espaço é exclusivo para o público de Únicas. Se você acredita que
        isso é um engano, fale com a equipe do ministério.
      </p>
      <Link
        href="/inicio"
        className="mt-8 inline-flex rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
