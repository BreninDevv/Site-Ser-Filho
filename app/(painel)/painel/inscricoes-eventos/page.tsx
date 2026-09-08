import { createClient } from "@/lib/supabase/server";
import {
  obterPerfilAtual,
  podeAprovarPagamento,
} from "@/lib/auth/permissoes";
import { BUCKET_COMPROVANTES_EVENTO } from "@/lib/validations/inscricao-evento";
import {
  ListaInscricoesEvento,
  type InscricaoEventoPainel,
} from "./lista";
import type { FormaPagamento } from "@/lib/validations/pagamento-encontro";
import type { StatusInscricao } from "@/lib/validations/inscricao-encontro";

export default async function PainelInscricoesEventosPage() {
  const perfil = await obterPerfilAtual();
  if (!podeAprovarPagamento(perfil)) {
    return (
      <div>
        <h1 className="mb-1 text-xl font-semibold">Inscrições de eventos</h1>
        <p className="text-sm text-muted-foreground">
          Só Dev, Tesouraria e Apóstolo(a) conferem essas inscrições.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  let { data, error } = await supabase
    .from("inscricoes_evento")
    .select("id, nome, idade, sexo, status, forma_pagamento, valor_cobrado_centavos, valor_pago_centavos, comprovante_path, created_at, eventos(nome)")
    .order("created_at", { ascending: false });

  if (error && /sexo/i.test(error.message ?? "")) {
    const retry = await supabase
      .from("inscricoes_evento")
      .select("id, nome, idade, status, forma_pagamento, valor_cobrado_centavos, valor_pago_centavos, comprovante_path, created_at, eventos(nome)")
      .order("created_at", { ascending: false });
    data = retry.data as typeof data;
    error = retry.error;
  }

  if (error) {
    return (
      <div>
        <h1 className="mb-1 text-xl font-semibold">Inscrições de eventos</h1>
        <p className="mt-4 border border-destructive/40 p-4 text-sm text-destructive">
          Não carregou. Rode{" "}
          <code>supabase/migrations/009_inscricoes_evento.sql</code> e{" "}
          <code>supabase/migrations/019_sexo_inscricoes_evento.sql</code> no
          Supabase.
        </p>
      </div>
    );
  }

  const brutas = data ?? [];
  const comprovantes = new Map<string, string>();
  const comArquivo = brutas.filter((i) => i.comprovante_path);
  const urls = await Promise.all(
    comArquivo.map(async (i) => {
      const { data: assinado } = await supabase.storage
        .from(BUCKET_COMPROVANTES_EVENTO)
        .createSignedUrl(i.comprovante_path as string, 60 * 30);
      return [i.id, assinado?.signedUrl ?? ""] as const;
    })
  );
  for (const [id, url] of urls) {
    if (url) comprovantes.set(id, url);
  }

  const inscricoes: InscricaoEventoPainel[] = brutas.map((i) => {
    const path = i.comprovante_path as string | null;
    const eventoRel = i.eventos as { nome: string } | { nome: string }[] | null;
    const eventoNome = Array.isArray(eventoRel)
      ? eventoRel[0]?.nome
      : eventoRel?.nome;
    return {
      id: i.id,
      nome: i.nome,
      idade: i.idade,
      sexo: ("sexo" in i ? (i.sexo as string | null) : null) ?? null,
      eventoNome: eventoNome ?? "Evento",
      status: i.status as StatusInscricao,
      forma_pagamento: i.forma_pagamento as FormaPagamento | null,
      valor_cobrado_centavos: i.valor_cobrado_centavos,
      valor_pago_centavos: i.valor_pago_centavos,
      comprovanteUrl: path ? comprovantes.get(i.id) ?? null : null,
      ehPdf: Boolean(path?.toLowerCase().endsWith(".pdf")),
      temComprovante: Boolean(path),
      created_at: i.created_at,
    };
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="mb-1 text-xl font-semibold">Inscrições de eventos</h1>
        <p className="text-sm text-muted-foreground">
          Conferir comprovante e marcar o pagamento como aprovado, recusado ou
          em análise.
        </p>
      </div>
      <ListaInscricoesEvento inscricoes={inscricoes} />
    </div>
  );
}
