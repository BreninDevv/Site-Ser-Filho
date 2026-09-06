import Link from "next/link";

export default function EsqueciSenhaEnviadoPage() {
  return (
    <div className="text-center">
      <h1 className="font-heading text-2xl uppercase mb-4">Verifique seu e-mail</h1>
      <p className="text-sm text-muted-foreground">
        Se esse e-mail estiver cadastrado, você vai receber um link para criar
        uma senha nova em alguns instantes. Confira também a caixa de spam.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Abra o link no <strong className="text-foreground">mesmo aparelho e
        navegador</strong> em que você pediu a recuperação. O plano gratuito do
        Supabase limita a quantidade de e-mails por hora — se não chegar, espere
        uns minutos e tente de novo.
      </p>
      <p className="mt-8 text-sm text-muted-foreground">
        <Link href="/login" className="font-semibold text-foreground underline underline-offset-4">
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}
