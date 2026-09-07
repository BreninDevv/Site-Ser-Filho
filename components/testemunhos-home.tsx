export type TestemunhoHome = {
  nome: string;
  descricao: string;
  destino: string;
  previa: string;
  video: boolean;
};

export function TestemunhosHome({ itens }: { itens: TestemunhoHome[] }) {
  if (itens.length === 0) {
    return (
      <div className="grid justify-items-center gap-6 sm:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <CartaoVazio key={n} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:justify-items-center sm:overflow-visible sm:pb-0">
      {itens.map((item) => (
        <CartaoReel key={item.nome + item.destino} item={item} />
      ))}
    </div>
  );
}

function CartaoReel({ item }: { item: TestemunhoHome }) {
  return (
    <a
      href={item.destino}
      target="_blank"
      rel="noopener noreferrer"
      className="relative aspect-[9/16] w-[16.5rem] shrink-0 overflow-hidden rounded-2xl border border-white bg-black sm:w-full sm:max-w-[20rem]"
    >
      {item.video && item.previa ? (
        <video
          src={item.previa}
          muted
          loop
          autoPlay
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : item.previa ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.previa}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}

      <div className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/80 bg-black/35">
          <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6 fill-white">
            <polygon points="7,5 20,12 7,19" />
          </svg>
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-4 pb-4 pt-16 text-left">
        <p className="text-sm font-semibold">{item.nome}</p>
        {item.descricao ? (
          <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-white/80">
            {item.descricao}
          </p>
        ) : null}
      </div>
    </a>
  );
}

function CartaoVazio() {
  return (
    <div className="relative aspect-[9/16] w-full max-w-[20rem] overflow-hidden rounded-2xl border border-white bg-black">
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/80">
          <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6 fill-white">
            <polygon points="7,5 20,12 7,19" />
          </svg>
        </span>
      </div>
    </div>
  );
}
