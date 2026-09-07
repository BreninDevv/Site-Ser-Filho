import { redirect } from "next/navigation";
import { PainelNav } from "@/components/painel-nav";
import {
  destinoDoPainel,
  eAcessoMaster,
  obterPerfilAtual,
  podeAdminUsuarios,
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
    <div className="flex min-h-full flex-col md:flex-row">
      <PainelNav
        titulo={master ? "Painel" : podeGerenciarMidia(perfil) ? "Mídia" : "Inscrições"}
        mostrarDashboard={master}
        mostrarEncontro={podeVerInscricoes(perfil)}
        mostrarMidia={podeGerenciarMidia(perfil)}
        mostrarAdmin={podeAdminUsuarios(perfil)}
      />
      <main className="flex-1 px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}
