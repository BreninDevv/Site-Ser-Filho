import { createClient } from "@/lib/supabase/server";
import {
  eLider,
  obterPerfilAtual,
  pastorIdDaEquipeDoPerfil,
  podeAprovarPagamento,
  podeVerInscricoes,
} from "@/lib/auth/permissoes";
import { BUCKET_COMPROVANTES } from "@/lib/validations/pagamento-encontro";
import { ListaInscricoes, type InscricaoPainel } from "./lista-inscricoes";

export default async function PainelEncontroPage() {
  const perfil = await obterPerfilAtual();
  const podeAprovar = podeAprovarPagamento(perfil);

  if (!podeVerInscricoes(perfil)) {
    return (
      <div>
        <h1 className="text-xl font-semibold mb-1">Inscrições do Volta ao Jardim</h1>
        <p className="text-sm text-muted-foreground">
          Apenas líderes e quem tem acesso master podem ver as inscrições.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  let consulta = supabase
    .from("inscricoes_encontro")
    .select("*")
    .order("created_at", { ascending: false });

  if (eLider(perfil)) {
    const pastorId = await pastorIdDaEquipeDoPerfil(perfil);
    if (!pastorId) {
      return (
        <div>
          <h1 className="text-xl font-semibold mb-1">Inscrições do Volta ao Jardim</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Você só vê as inscrições da sua equipe. Peça ao pastor para te
            colocar na equipe pastoral pelo cadastro.
          </p>
        </div>
      );
    }
    consulta = consulta.eq("pastor_id", pastorId);
  }

  const { data, error } = await consulta;

  if (error) {
    return (
      <div>
        <h1 className="text-xl font-semibold mb-1">Inscrições do Volta ao Jardim</h1>
        <p className="mt-4 border border-destructive/40 p-4 text-sm text-destructive">
          Não foi possível carregar as inscrições. Rode{" "}
          <code>supabase/migrations/002_pagamento_encontro.sql</code> no SQL
          Editor do Supabase se ainda não rodou.
        </p>
      </div>
    );
  }

  const brutas = data ?? [];
  const comprovantes = new Map<string, string>();
  const comprovantesComplemento = new Map<string, string>();

  if (podeAprovar) {
    const comArquivo = brutas.filter((i) => i.comprovante_path);
    const urls = await Promise.all(
      comArquivo.map(async (i) => {
        const { data: assinado } = await supabase.storage
          .from(BUCKET_COMPROVANTES)
          .createSignedUrl(i.comprovante_path, 60 * 30);
        return [i.id, assinado?.signedUrl ?? ""] as const;
      })
    );
    for (const [id, url] of urls) {
      if (url) comprovantes.set(id, url);
    }

    const comComplemento = brutas.filter((i) => i.complemento_comprovante_path);
    const urlsComplemento = await Promise.all(
      comComplemento.map(async (i) => {
        const { data: assinado } = await supabase.storage
          .from(BUCKET_COMPROVANTES)
          .createSignedUrl(i.complemento_comprovante_path, 60 * 30);
        return [i.id, assinado?.signedUrl ?? ""] as const;
      })
    );
    for (const [id, url] of urlsComplemento) {
      if (url) comprovantesComplemento.set(id, url);
    }
  }

  const inscricoes: InscricaoPainel[] = brutas.map((i) => {
    const path = i.comprovante_path as string | null;
    return {
      id: i.id,
      nome_completo: i.nome_completo,
      email: i.email,
      telefone: i.telefone,
      data_nascimento: i.data_nascimento,
      cidade: i.cidade,
      nome_contato_emergencia: i.nome_contato_emergencia,
      telefone_contato_emergencia: i.telefone_contato_emergencia,
      observacoes: i.observacoes,
      como_soube: i.como_soube,
      papel_encontro: i.papel_encontro ?? null,
      pastor_nome: i.pastor_nome ?? null,
      autorizacao_lider: Boolean(i.autorizacao_lider),
      status: i.status,
      presente: i.presente,
      created_at: i.created_at,
      forma_pagamento: i.forma_pagamento,
      parcelas: i.parcelas,
      qtd_criancas: i.qtd_criancas ?? 0,
      valor_devido_centavos: i.valor_devido_centavos ?? 0,
      valor_cobrado_centavos: i.valor_cobrado_centavos ?? 0,
      valor_pago_centavos: i.valor_pago_centavos ?? 0,
      pagamento_observacao: i.pagamento_observacao,
      comprovanteUrl: comprovantes.get(i.id) ?? null,
      ehPdf: Boolean(path?.toLowerCase().endsWith(".pdf")),
      temComprovante: Boolean(path),
      complemento_pendente: Boolean(i.complemento_pendente),
      complemento_forma: i.complemento_forma ?? null,
      complemento_valor_centavos: i.complemento_valor_centavos ?? 0,
      complementoComprovanteUrl: comprovantesComplemento.get(i.id) ?? null,
      temComprovanteComplemento: Boolean(i.complemento_comprovante_path),
      ehPdfComplemento: Boolean(
        String(i.complemento_comprovante_path ?? "")
          .toLowerCase()
          .endsWith(".pdf")
      ),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold mb-1">Inscrições do Volta ao Jardim</h1>
        <p className="text-sm text-muted-foreground">
          {podeAprovar
            ? "Comece pelos que estão em Para conferir. Aprove só depois de olhar o comprovante."
            : eLider(perfil)
              ? "Você vê só as inscrições da sua equipe pastoral. Quem confirma pagamento é Tesouraria, Apóstolo(a) ou Dev."
              : "Você pode ver a lista. Quem confirma pagamento é Tesouraria, Apóstolo(a) ou Dev."}
        </p>
      </div>

      <ListaInscricoes inscricoes={inscricoes} podeAprovar={podeAprovar} />
    </div>
  );
}
