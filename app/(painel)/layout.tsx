import { redirect } from "next/navigation";
import { PainelNav } from "@/components/painel-nav";
import {
  destinoDoPainel,
  eAcessoMaster,
  obterPerfilAtual,
  podeAdminUsuarios,
  podeAprovarPagamento,
  podeGerenciarMidia,
  podeVerInscricoes,
} from "@/lib/auth/permissoes";

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const perfil = await obterPerfilAtual();
  if (!perfil || !destinoDoPainel(perfil.role)) {
    redirect("/login");
  }

  const master = eAcessoMaster(perfil);

  return (
    <div className="flex min-h-full min-w-0 flex-col overflow-x-clip md:flex-row">
      <PainelNav
        titulo={master ? "Painel" : podeGerenciarMidia(perfil) ? "Mídia" : "Inscrições"}
        mostrarDashboard={master}
        mostrarEncontro={podeVerInscricoes(perfil)}
        mostrarMidia={podeGerenciarMidia(perfil)}
        mostrarInscricoesEventos={podeAprovarPagamento(perfil)}
        mostrarAdmin={podeAdminUsuarios(perfil)}
      />
      <main className="min-w-0 flex-1 px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}
