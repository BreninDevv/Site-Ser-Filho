import { PainelNav } from "@/components/painel-nav";

export default function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <PainelNav />
      <main className="flex-1 px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}
