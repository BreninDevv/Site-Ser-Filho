import Link from "next/link";
import { AuthBrandShell } from "@/components/auth/auth-brand-shell";

export default function EsqueciSenhaEnviadoPage() {
  return (
    <AuthBrandShell>
      <div className="text-center">
        <h1 className="font-heading mb-4 text-2xl uppercase">
          Verifique seu e-mail
        </h1>
        <p className="text-sm text-muted-foreground">
          Se esse e-mail estiver cadastrado, você vai receber um link para criar
          uma senha nova em alguns instantes. Confira também a caixa de spam.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Abra o link no{" "}
          <strong className="text-foreground">mesmo aparelho e navegador</strong>{" "}
          em que você pediu a recuperação.
        </p>
        <p className="mt-8 text-sm text-muted-foreground">
          <Link
            href="/login"
            className="font-semibold text-foreground underline underline-offset-4"
          >
            Voltar para o login
          </Link>
        </p>
      </div>
    </AuthBrandShell>
  );
}
