import { PainelNav } from "@/components/painel-nav";
import {
  eAcessoMaster,
  obterPerfilAtual,
  podeAdminUsuarios,
  podeVerInscricoes,
} from "@/lib/auth/permissoes";

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const perfil = await obterPerfilAtual();
  const master = eAcessoMaster(perfil);

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <PainelNav
        titulo={master ? "Painel" : "Inscrições"}
        mostrarDashboard={master}
        mostrarEncontro={podeVerInscricoes(perfil)}
        mostrarAdmin={podeAdminUsuarios(perfil)}
      />
      <main className="flex-1 px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}
