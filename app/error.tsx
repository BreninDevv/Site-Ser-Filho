"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="font-heading text-2xl font-bold">
        Não foi possível carregar esta página
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        Tente de novo. Se o erro continuar, feche a aba e abra o site outra
        vez.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 bg-foreground px-4 py-2.5 text-sm font-semibold text-background"
      >
        Tentar de novo
      </button>
    </div>
  );
}
