import { PublicHeader } from "@/components/public-header";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full min-w-0 w-full max-w-full flex-col overflow-x-hidden">
      <PublicHeader />
      <main className="min-w-0 w-full flex-1">{children}</main>
    </div>
  );
}
