import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-6 text-lg font-semibold tracking-tight">
        Ser Filho
      </Link>
      <div className="w-full max-w-md">{children}</div>
      <Button variant="link" className="mt-4" asChild>
        <Link href="/">Voltar ao início</Link>
      </Button>
    </div>
  );
}
