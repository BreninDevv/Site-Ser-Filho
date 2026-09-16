import { redirect } from "next/navigation";
import { PainelNav } from "@/components/painel-nav";
import {
  destinoDoPainel,
  eAcessoMaster,
  obterPerfilAtual,
  podeAdminUsuarios,
  podeAprovarPagamento,
  podeConferirPlanilha,
  podeGerenciarMidia,
  podeVerInscricoes,
  ROTULOS_ROLE,
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
  const tituloPainel = master
    ? "Painel"
    : podeGerenciarMidia(perfil)
      ? "Mídia"
      : podeConferirPlanilha(perfil)
        ? "Porta / Inscrições"
        : "Inscrições";

  return (
    <PainelNav
      titulo={perfil.nome?.trim() || "Ser Filho"}
      subtitulo={`${tituloPainel} · ${ROTULOS_ROLE[perfil.role] ?? perfil.role}`}
      mostrarDashboard={master}
      mostrarEncontro={podeVerInscricoes(perfil)}
      mostrarMidia={podeGerenciarMidia(perfil)}
      mostrarInscricoesEventos={podeAprovarPagamento(perfil)}
      mostrarPlanilha={podeConferirPlanilha(perfil)}
      mostrarAdmin={podeAdminUsuarios(perfil)}
    >
      {children}
    </PainelNav>
  );
}
