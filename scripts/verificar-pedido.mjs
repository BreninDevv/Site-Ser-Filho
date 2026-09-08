import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((linha) => linha.includes("=") && !linha.trim().startsWith("#"))
    .map((linha) => {
      const i = linha.indexOf("=");
      return [linha.slice(0, i).trim(), linha.slice(i + 1).trim()];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anon) {
  console.error("FALHOU: .env.local sem URL ou anon key do Supabase.");
  process.exit(1);
}

let falhas = 0;
function ok(nome) {
  console.log(`OK   ${nome}`);
}
function falhou(nome, detalhe) {
  falhas += 1;
  console.log(`FALHOU  ${nome}`);
  if (detalhe) console.log(`       ${detalhe}`);
}

const ROLES_CADASTRO = [
  "discipulo",
  "lider",
  "pastor",
  "apostolo",
  "midia",
  "tesouraria",
];
const ROTULOS_ROLE_CADASTRO = {
  discipulo: "Discípulo",
  lider: "Líder",
  pastor: "Pastor",
  apostolo: "Apóstolo",
  midia: "Líder de mídia",
  tesouraria: "Tesouraria",
};
const TEMPOS_IGREJA = [
  "Menos de 6 meses",
  "6 meses a 1 ano",
  "1 a 3 anos",
  "3 a 5 anos",
  "5 a 10 anos",
  "Mais de 10 anos",
];
const ROTULOS_ROLE = {
  lider: "Líder",
  pastor: "Pastor",
  discipulo: "Discípulo",
  membro: "Discípulo",
  midia: "Líder de mídia",
};

function precisaEscolherEquipe(role) {
  return role === "discipulo" || role === "lider";
}

function ehHoneypot(formData) {
  const isca = String(formData.get("hp_campo_extra") ?? "").trim();
  if (!isca) return false;
  const nome = String(
    formData.get("nome") ?? formData.get("nome_completo") ?? ""
  ).trim();
  const email = String(formData.get("email") ?? "").trim();
  if (nome.length >= 3 || email.includes("@")) return false;
  return true;
}

function destinoDoPainel(role) {
  if (["dev", "tesouraria", "apostolo"].includes(role)) return "/painel";
  if (role === "lider" || role === "pastor") return "/painel/encontro";
  if (role === "midia") return "/painel/eventos";
  return null;
}

function podeVerInscricoes(role) {
  return ["dev", "tesouraria", "apostolo", "lider", "pastor"].includes(role);
}

function podeAprovarPagamento(role) {
  return ["dev", "tesouraria", "apostolo"].includes(role);
}

if (
  ROLES_CADASTRO.includes("discipulo") &&
  !ROLES_CADASTRO.includes("membro") &&
  ROTULOS_ROLE_CADASTRO.discipulo === "Discípulo" &&
  ROTULOS_ROLE.discipulo === "Discípulo" &&
  ROTULOS_ROLE.lider === "Líder" &&
  ROTULOS_ROLE.pastor === "Pastor" &&
  ROTULOS_ROLE.lider !== "Líder/Pastor"
) {
  ok("roles: Discípulo, Líder e Pastor separados");
} else {
  falhou("roles: Discípulo, Líder e Pastor separados");
}

if (
  precisaEscolherEquipe("discipulo") &&
  precisaEscolherEquipe("lider") &&
  !precisaEscolherEquipe("pastor") &&
  !precisaEscolherEquipe("apostolo") &&
  !precisaEscolherEquipe("midia") &&
  !precisaEscolherEquipe("tesouraria")
) {
  ok("equipe obrigatória só para discípulo e líder");
} else {
  falhou("equipe obrigatória só para discípulo e líder");
}

if (TEMPOS_IGREJA.length === 6 && TEMPOS_IGREJA[0].includes("6 meses")) {
  ok("tempos de igreja no cadastro");
} else {
  falhou("tempos de igreja no cadastro");
}

const bot = new FormData();
bot.set("hp_campo_extra", "spam");
const pessoa = new FormData();
pessoa.set("hp_campo_extra", "Aldo Silva");
pessoa.set("nome", "Aldo Silva");
pessoa.set("email", "aldo@igreja.com");
const vazia = new FormData();
if (ehHoneypot(bot) && !ehHoneypot(pessoa) && !ehHoneypot(vazia)) {
  ok("honeypot: bot cai, pessoa com nome real passa");
} else {
  falhou("honeypot: bot cai, pessoa com nome real passa");
}

if (
  destinoDoPainel("discipulo") === null &&
  destinoDoPainel("lider") === "/painel/encontro" &&
  destinoDoPainel("pastor") === "/painel/encontro" &&
  destinoDoPainel("midia") === "/painel/eventos" &&
  destinoDoPainel("apostolo") === "/painel" &&
  destinoDoPainel("tesouraria") === "/painel"
) {
  ok("painel: discípulo sem acesso, líder/pastor/equipe com rota certa");
} else {
  falhou("painel: discípulo sem acesso, líder/pastor/equipe com rota certa");
}

if (
  podeVerInscricoes("lider") &&
  podeVerInscricoes("pastor") &&
  !podeVerInscricoes("discipulo") &&
  !podeAprovarPagamento("lider") &&
  !podeAprovarPagamento("pastor") &&
  !podeAprovarPagamento("discipulo") &&
  podeAprovarPagamento("tesouraria")
) {
  ok("permissões: líder/pastor veem inscrição, discípulo não, tesouraria aprova");
} else {
  falhou("permissões de inscrição e pagamento");
}

const supabase = createClient(url, anon);

const { data: equipes, error: erroEquipes } = await supabase
  .from("equipes_pastorais")
  .select("id, nome")
  .limit(20);
if (erroEquipes) {
  falhou("tabela equipes_pastorais", `${erroEquipes.message} — rode a migration 016`);
} else {
  ok(`tabela equipes_pastorais visível (${equipes?.length ?? 0} equipe(s))`);
}

const { error: erroInsertEquipe } = await supabase.from("equipes_pastorais").insert({
  nome: "Equipe Teste Anonima",
});
if (erroInsertEquipe) ok("anonimo nao cria equipe pastoral");
else falhou("RLS deveria barrar insert anonimo em equipes_pastorais");

const { error: erroColunaTempo } = await supabase
  .from("perfis")
  .select("tempo_igreja")
  .limit(0);
if (erroColunaTempo) {
  falhou("coluna perfis.tempo_igreja", `${erroColunaTempo.message} — rode a migration 016`);
} else {
  ok("coluna perfis.tempo_igreja");
}

const { error: erroColunaEquipe } = await supabase
  .from("perfis")
  .select("equipe_id")
  .limit(0);
if (erroColunaEquipe) {
  falhou("coluna perfis.equipe_id", `${erroColunaEquipe.message} — rode a migration 016`);
} else {
  ok("coluna perfis.equipe_id");
}

const { data: rpcEncontro, error: erroRpcEncontro } = await supabase.rpc(
  "status_pagamento_encontro"
);
if (erroRpcEncontro) {
  ok("anonimo nao consulta status_pagamento_encontro");
} else if (rpcEncontro == null) {
  ok("RPC encontro nao vaza inscricao para visitante");
} else {
  falhou("RPC encontro vazou status para visitante", String(rpcEncontro));
}

const { data: rpcLegado, error: erroRpcLegado } = await supabase.rpc(
  "status_pagamento_legado"
);
if (erroRpcLegado) ok("anonimo nao consulta status_pagamento_legado");
else if (rpcLegado == null) {
  ok("RPC legado nao vaza inscricao para visitante");
} else {
  falhou("RPC legado vazou status para visitante", String(rpcLegado));
}

const paginas = [
  ["/cadastro", 200],
  ["/login", 200],
  ["/encontro-com-deus", 200],
  ["/legado-de-cristo", 200],
  ["/eventos", 200],
  ["/inicio", 200],
  ["/painel/admin/usuarios", [307, 308]],
  ["/painel/encontro", [307, 308]],
  ["/painel/inscricoes-eventos", [307, 308]],
];

for (const [caminho, esperado] of paginas) {
  const res = await fetch(`http://localhost:3000${caminho}`, { redirect: "manual" });
  const aceitos = Array.isArray(esperado) ? esperado : [esperado];
  if (aceitos.includes(res.status)) ok(`HTTP ${res.status} ${caminho}`);
  else falhou(`HTTP ${caminho}`, `status ${res.status}, esperado ${aceitos.join("/")}`);
}

async function htmlDe(caminho) {
  const res = await fetch(`http://localhost:3000${caminho}`);
  return { status: res.status, html: await res.text() };
}

const cadastro = await htmlDe("/cadastro");
if (cadastro.status === 200) ok("HTTP 200 /cadastro");
else falhou("HTTP /cadastro", `status ${cadastro.status}`);

const testesCadastro = [
  ["Você é?", cadastro.html.includes("Você é?")],
  ["equipe pastoral", cadastro.html.includes("equipe pastoral")],
  ["tempo de igreja", cadastro.html.includes("quanto tempo")],
  ["Discípulo", cadastro.html.includes("Discípulo")],
  ["Líder", cadastro.html.includes("Líder")],
  ["Pastor", cadastro.html.includes("Pastor")],
  ["Apóstolo", cadastro.html.includes("Apóstolo")],
  ["Líder de mídia", cadastro.html.includes("Líder de mídia")],
  ["Tesouraria", cadastro.html.includes("Tesouraria")],
  ["sem rótulo Líder/Pastor", !cadastro.html.includes("Líder/Pastor")],
  ["sem opção Membro", !cadastro.html.includes(">Membro<")],
  ["campo funcao", cadastro.html.includes('name="funcao"') || cadastro.html.includes("funcao")],
  ["campo tempo_igreja", cadastro.html.includes("tempo_igreja")],
];
for (const [nome, passou] of testesCadastro) {
  if (passou) ok(`cadastro tem ${nome}`);
  else falhou(`cadastro tem ${nome}`);
}

const encontro = await htmlDe("/encontro-com-deus");
if (encontro.html.includes("Status do pagamento")) ok("encontro tem bloco de status");
else falhou("encontro sem bloco de status");
if (encontro.html.includes("Criar conta") || encontro.html.includes("criar uma conta")) {
  ok("encontro avisa visitante sobre cadastro para ver status");
} else {
  falhou("encontro sem aviso de cadastro para ver status");
}
if (encontro.html.includes("Application error")) falhou("encontro com erro de runtime");
else ok("encontro sem erro de runtime");

const legado = await htmlDe("/legado-de-cristo");
if (legado.html.includes("Status do pagamento")) ok("legado tem bloco de status");
else falhou("legado sem bloco de status");
if (legado.html.includes("Criar conta") || legado.html.includes("criar uma conta")) {
  ok("legado avisa visitante sobre cadastro para ver status");
} else {
  falhou("legado sem aviso de cadastro para ver status");
}

const login = await htmlDe("/login");
if (login.html.includes("Discípulo") || login.html.includes("discípulo")) {
  ok("login fala em discípulo");
} else {
  falhou("login não fala em discípulo");
}
if (login.html.includes("Continuar como visitante")) ok("login tem entrar como visitante");
else falhou("login sem entrar como visitante");

const { data: eventos } = await supabase
  .from("eventos")
  .select("id")
  .eq("exige_inscricao", true)
  .limit(1);

if (eventos?.[0]?.id) {
  const pagina = await htmlDe(`/eventos/${eventos[0].id}`);
  if (pagina.status === 200) ok("HTTP 200 página do evento com inscrição");
  else falhou("página do evento", `status ${pagina.status}`);
  if (pagina.html.includes("Status do pagamento")) ok("evento tem bloco de status");
  else falhou("evento sem bloco de status");
  if (pagina.html.includes("Criar conta") || pagina.html.includes("criar uma conta")) {
    ok("evento avisa visitante sobre cadastro para ver status");
  } else {
    falhou("evento sem aviso de cadastro para ver status");
  }
  if (pagina.html.includes("Application error")) falhou("evento com erro de runtime");
  else ok("evento sem erro de runtime");
} else {
  falhou("nenhum evento com inscrição para testar a página");
}

const arquivos = {
  "lib/auth/roles.ts": readFileSync("lib/auth/roles.ts", "utf8"),
  "app/(auth)/cadastro/form-cadastro.tsx": readFileSync(
    "app/(auth)/cadastro/form-cadastro.tsx",
    "utf8"
  ),
  "app/(painel)/painel/admin/usuarios/page.tsx": readFileSync(
    "app/(painel)/painel/admin/usuarios/page.tsx",
    "utf8"
  ),
};

if (!arquivos["lib/auth/roles.ts"].includes('lider: "Líder/Pastor"')) {
  ok("código não usa mais o rótulo Líder/Pastor");
} else {
  falhou("código ainda tem rótulo Líder/Pastor");
}
if (
  arquivos["app/(auth)/cadastro/form-cadastro.tsx"].includes("equipe_nome") &&
  arquivos["app/(auth)/cadastro/form-cadastro.tsx"].includes("equipe_id")
) {
  ok("cadastro tem campo de nome (pastor) e lista (demais)");
} else {
  falhou("cadastro sem os dois modos de equipe");
}
if (arquivos["app/(painel)/painel/admin/usuarios/page.tsx"].includes("Discípulos")) {
  ok("painel de usuários lista Discípulos");
} else {
  falhou("painel de usuários sem lista de Discípulos");
}

console.log("");
if (falhas) {
  console.log(`${falhas} falha(s).`);
  process.exit(1);
}
console.log("Todos os testes do pedido passaram.");
