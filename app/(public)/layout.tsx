import { PublicHeader } from "@/components/public-header";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full min-w-0 flex-col overflow-x-clip">
      <PublicHeader />
      <main className="min-w-0 w-full flex-1">{children}</main>
    </div>
  );
}
