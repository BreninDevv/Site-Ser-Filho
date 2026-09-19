import { Login10View } from "@/components/auth/login10";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    erro?: string;
    confirmado?: string;
    senha_redefinida?: string;
  }>;
}) {
  const { erro, confirmado, senha_redefinida } = await searchParams;

  return (
    <Login10View
      erroInicial={erro}
      confirmado={confirmado === "1"}
      senhaRedefinida={senha_redefinida === "1"}
    />
  );
}
