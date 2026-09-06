import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { obterPerfilAtual, podeGerenciar } from "@/lib/auth/permissoes";
import { ExcluirInscricaoButton } from "@/components/excluir-inscricao-button";
import {
  STATUS_INSCRICAO,
  type StatusInscricao,
} from "@/lib/validations/inscricao-encontro";
import { alternarPresenca, definirStatus, excluirInscricao } from "./actions";

type Inscricao = {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  sexo: string | null;
  cidade: string | null;
  nome_contato_emergencia: string | null;
  telefone_contato_emergencia: string | null;
  observacoes: string | null;
  como_soube: string | null;
  status: StatusInscricao;
  presente: boolean;
  created_at: string;
};

const ROTULOS_STATUS: Record<StatusInscricao, string> = {
  pendente: "Pendente",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
};

const CLASSES_STATUS: Record<StatusInscricao, string> = {
  pendente: "border-border text-muted-foreground",
  confirmada: "border-foreground text-foreground",
  cancelada: "border-destructive/40 text-destructive",
};

function calcularIdade(dataNascimento: string) {
  const nascimento = new Date(`${dataNascimento}T00:00:00`);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();

  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }

  return idade;
}

function formatarTelefone(digitos: string) {
  if (digitos.length === 11) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  }
  if (digitos.length === 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return digitos;
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default async function PainelEncontroPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: filtro } = await searchParams;
  const perfil = await obterPerfilAtual();

  if (!podeGerenciar(perfil)) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-1">Inscrições do Encontro</h1>
        <p className="text-sm text-muted-foreground">
          Apenas líderes, pastores e dev podem ver as inscrições.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inscricoes_encontro")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-1">Inscrições do Encontro</h1>
        <p className="mt-4 border border-destructive/40 p-4 text-sm text-destructive">
          Não foi possível carregar as inscrições. Se a tabela ainda não existe,
          rode <code>supabase/migrations/001_inscricoes_encontro.sql</code> no SQL
          Editor do Supabase.
        </p>
      </div>
    );
  }

  const inscricoes = (data ?? []) as Inscricao[];

  const contagem = {
    todas: inscricoes.length,
    pendente: inscricoes.filter((i) => i.status === "pendente").length,
    confirmada: inscricoes.filter((i) => i.status === "confirmada").length,
    cancelada: inscricoes.filter((i) => i.status === "cancelada").length,
    presentes: inscricoes.filter((i) => i.presente).length,
  };

  const filtroAtivo = STATUS_INSCRICAO.includes(filtro as StatusInscricao)
    ? (filtro as StatusInscricao)
    : null;

  const visiveis = filtroAtivo
    ? inscricoes.filter((i) => i.status === filtroAtivo)
    : inscricoes;

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-xl font-semibold mb-1">Inscrições do Encontro</h1>
        <p className="text-sm text-muted-foreground">
          {contagem.todas} inscrição(ões) no total · {contagem.confirmada} confirmada(s)
          · {contagem.presentes} com presença marcada
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={filtroAtivo === null ? "default" : "outline"}
          size="sm"
          asChild
        >
          <Link href="/painel/encontro">Todas ({contagem.todas})</Link>
        </Button>
        {STATUS_INSCRICAO.map((status) => (
          <Button
            key={status}
            variant={filtroAtivo === status ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={`/painel/encontro?status=${status}`}>
              {ROTULOS_STATUS[status]} ({contagem[status]})
            </Link>
          </Button>
        ))}
      </div>

      {visiveis.length === 0 ? (
        <p className="border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {contagem.todas === 0
            ? "Ninguém se inscreveu ainda."
            : "Nenhuma inscrição com esse status."}
        </p>
      ) : (
        <ul className="space-y-3">
          {visiveis.map((inscricao) => (
            <li key={inscricao.id} className="border border-border p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{inscricao.nome_completo}</h2>
                  <p className="text-sm text-muted-foreground">
                    {calcularIdade(inscricao.data_nascimento)} anos
                    {inscricao.cidade ? ` · ${inscricao.cidade}` : ""} · inscrito em{" "}
                    {formatarData(inscricao.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {inscricao.presente && (
                    <span className="border border-foreground px-2 py-0.5 text-xs font-semibold">
                      Presente
                    </span>
                  )}
                  <span
                    className={`border px-2 py-0.5 text-xs font-semibold ${CLASSES_STATUS[inscricao.status]}`}
                  >
                    {ROTULOS_STATUS[inscricao.status]}
                  </span>
                </div>
              </div>

              <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Telefone</dt>
                  <dd>{formatarTelefone(inscricao.telefone)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">E-mail</dt>
                  <dd className="break-all">{inscricao.email}</dd>
                </div>
                {inscricao.nome_contato_emergencia && (
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Contato de emergência
                    </dt>
                    <dd>
                      {inscricao.nome_contato_emergencia}
                      {inscricao.telefone_contato_emergencia
                        ? ` · ${formatarTelefone(inscricao.telefone_contato_emergencia)}`
                        : ""}
                    </dd>
                  </div>
                )}
                {inscricao.como_soube && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Como soube</dt>
                    <dd>{inscricao.como_soube}</dd>
                  </div>
                )}
                {inscricao.observacoes && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-muted-foreground">
                      Saúde / alimentação
                    </dt>
                    <dd>{inscricao.observacoes}</dd>
                  </div>
                )}
              </dl>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                {inscricao.status !== "confirmada" && (
                  <form action={definirStatus.bind(null, inscricao.id, "confirmada")}>
                    <Button size="sm" type="submit">
                      Confirmar
                    </Button>
                  </form>
                )}
                {inscricao.status !== "cancelada" && (
                  <form action={definirStatus.bind(null, inscricao.id, "cancelada")}>
                    <Button size="sm" variant="outline" type="submit">
                      Cancelar
                    </Button>
                  </form>
                )}
                {inscricao.status !== "pendente" && (
                  <form action={definirStatus.bind(null, inscricao.id, "pendente")}>
                    <Button size="sm" variant="outline" type="submit">
                      Voltar para pendente
                    </Button>
                  </form>
                )}
                <form
                  action={alternarPresenca.bind(
                    null,
                    inscricao.id,
                    !inscricao.presente
                  )}
                >
                  <Button size="sm" variant="outline" type="submit">
                    {inscricao.presente ? "Desmarcar presença" : "Marcar presença"}
                  </Button>
                </form>
                <ExcluirInscricaoButton
                  inscricaoId={inscricao.id}
                  nome={inscricao.nome_completo}
                  action={excluirInscricao}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
