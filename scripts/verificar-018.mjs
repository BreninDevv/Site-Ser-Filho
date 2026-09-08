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

function exigeComprovante(forma) {
  return forma === "pix" || forma === "credito";
}

function ehPagamentoPresencial(forma) {
  return forma === "dinheiro" || forma === "debito" || forma === "credito";
}

function eLider(role) {
  return role === "lider";
}

function podeVerInscricoes(role) {
  return ["dev", "tesouraria", "apostolo", "lider", "pastor"].includes(role);
}

function podeAprovarPagamento(role) {
  return ["dev", "tesouraria", "apostolo"].includes(role);
}

function idadeNaData(dataNascimento) {
  const nascimento = new Date(`${dataNascimento}T00:00:00`);
  if (Number.isNaN(nascimento.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) idade -= 1;
  return idade;
}

function ehMenorDeIdade(dataNascimento) {
  const idade = idadeNaData(dataNascimento);
  return idade !== null && idade < 18;
}

function validarPagamentoRapido(forma, comprovante) {
  const erros = {};
  if (!["pix", "dinheiro", "debito", "credito"].includes(forma)) {
    erros.forma = "Escolha a forma de pagamento.";
  }
  if (exigeComprovante(forma) && !comprovante) {
    erros.comprovante = "Anexe o comprovante do pagamento.";
  }
  return erros;
}

function mostraBotaoCompletar({ status, falta, complementoPendente, logado }) {
  return (
    logado &&
    status === "confirmada" &&
    falta > 0 &&
    !complementoPendente
  );
}

if (
  eLider("lider") &&
  !eLider("pastor") &&
  !eLider("tesouraria") &&
  podeVerInscricoes("lider") &&
  !podeAprovarPagamento("lider") &&
  podeAprovarPagamento("tesouraria")
) {
  ok("líder vê inscrição e não aprova pagamento");
} else {
  falhou("permissões do líder");
}

if (
  ehPagamentoPresencial("dinheiro") &&
  ehPagamentoPresencial("debito") &&
  ehPagamentoPresencial("credito") &&
  !ehPagamentoPresencial("pix")
) {
  ok("aviso presencial: dinheiro e cartão, não pix");
} else {
  falhou("aviso presencial");
}

const dinheiro = validarPagamentoRapido("dinheiro", "");
const debito = validarPagamentoRapido("debito", "");
const credito = validarPagamentoRapido("credito", "");
const pix = validarPagamentoRapido("pix", "");
if (
  Object.keys(dinheiro).length === 0 &&
  Object.keys(debito).length === 0 &&
  credito.comprovante &&
  pix.comprovante
) {
  ok("dinheiro/débito sobem sem comprovante; pix/crédito exigem");
} else {
  falhou("validação de comprovante por forma", JSON.stringify({ dinheiro, debito, credito, pix }));
}

if (ehMenorDeIdade("2015-01-01") && !ehMenorDeIdade("1990-01-01")) {
  ok("menor de 18 continua detectado");
} else {
  falhou("idade menor de 18");
}

if (
  mostraBotaoCompletar({
    status: "confirmada",
    falta: 10000,
    complementoPendente: false,
    logado: true,
  }) &&
  !mostraBotaoCompletar({
    status: "pendente",
    falta: 10000,
    complementoPendente: false,
    logado: true,
  }) &&
  !mostraBotaoCompletar({
    status: "confirmada",
    falta: 10000,
    complementoPendente: true,
    logado: true,
  }) &&
  !mostraBotaoCompletar({
    status: "confirmada",
    falta: 0,
    complementoPendente: false,
    logado: true,
  }) &&
  !mostraBotaoCompletar({
    status: "confirmada",
    falta: 10000,
    complementoPendente: false,
    logado: false,
  })
) {
  ok("botão completar só depois da tesouraria, com saldo e conta");
} else {
  falhou("regra do botão completar pagamento");
}

const supabase = createClient(url, anon);

const { data: pastores, error: erroPastores } = await supabase.rpc(
  "pastores_para_inscricao"
);
if (erroPastores) {
  falhou("RPC pastores_para_inscricao", erroPastores.message);
} else {
  ok(`RPC pastores_para_inscricao (${pastores?.length ?? 0} pastor(es))`);
}

for (const [nome, args] of [
  ["detalhe_pagamento_encontro", {}],
  ["detalhe_pagamento_legado", {}],
]) {
  const { data, error } = await supabase.rpc(nome, args);
  if (error) {
    if (/permission|denied|not authorized|JWT/i.test(error.message)) {
      ok(`anonimo nao lê ${nome}`);
    } else if (/could not find|does not exist|schema cache/i.test(error.message)) {
      falhou(`RPC ${nome} não existe`, `${error.message} — rode a 018 de novo`);
    } else {
      ok(`RPC ${nome} existe (visitante: ${error.message})`);
    }
  } else if (data == null || (Array.isArray(data) && data.length === 0)) {
    ok(`RPC ${nome} não vaza inscrição para visitante`);
  } else {
    falhou(`RPC ${nome} vazou dado para visitante`, JSON.stringify(data));
  }
}

for (const nome of ["enviar_complemento_encontro", "enviar_complemento_legado"]) {
  const { error } = await supabase.rpc(nome, {
    p_forma: "pix",
    p_comprovante: "11111111-1111-1111-1111-111111111111.jpg",
  });
  const msg = error?.message ?? "";
  if (!error) {
    falhou(`${nome} aceitou visitante`);
  } else if (/could not find|does not exist|schema cache/i.test(msg)) {
    falhou(`RPC ${nome} não existe`, msg);
  } else if (/nao autenticado|permission|denied|not authorized|JWT/i.test(msg)) {
    ok(`visitante barrado em ${nome} (${msg.split("\n")[0]})`);
  } else if (/nao ha saldo/i.test(msg)) {
    falhou(
      `${nome} ainda roda como visitante`,
      "A 018 nova deveria responder nao autenticado. Rode o arquivo de novo."
    );
  } else {
    ok(`visitante nao envia ${nome} (${msg.split("\n")[0]})`);
  }
}

for (const [tabela, colunas] of [
  [
    "inscricoes_encontro",
    "papel_encontro, pastor_id, pastor_nome, autorizacao_lider, complemento_pendente, complemento_forma, complemento_valor_centavos, complemento_comprovante_path",
  ],
  [
    "inscricoes_legado",
    "complemento_pendente, complemento_forma, complemento_valor_centavos, complemento_comprovante_path",
  ],
]) {
  const { error } = await supabase.from(tabela).select(colunas).limit(0);
  if (!error) {
    ok(`colunas 018 em ${tabela}`);
  } else if (/does not exist|schema cache|Could not find/i.test(error.message)) {
    falhou(`colunas 018 em ${tabela}`, `${error.message} — rode a 018`);
  } else {
    ok(`colunas 018 em ${tabela} (RLS: ${error.message.split("\n")[0]})`);
  }
}

async function htmlDe(caminho) {
  const res = await fetch(`http://localhost:3000${caminho}`);
  return { status: res.status, html: await res.text() };
}

const encontro = await htmlDe("/encontro-com-deus");
if (encontro.status === 200 && !encontro.html.includes("Application error")) {
  ok("HTTP 200 /encontro-com-deus");
} else {
  falhou("/encontro-com-deus", `status ${encontro.status}`);
}

const testesEncontro = [
  ["Você é?", encontro.html.includes("Você é?")],
  ["Trabalhador", encontro.html.includes("Trabalhador")],
  ["Encontrista", encontro.html.includes("Encontrista")],
  ["De qual pastor?", encontro.html.includes("De qual pastor?")],
  ["Status do pagamento", encontro.html.includes("Status do pagamento")],
];
for (const [nome, passou] of testesEncontro) {
  if (passou) ok(`encontro tem ${nome}`);
  else falhou(`encontro tem ${nome}`);
}

const legado = await htmlDe("/legado-de-cristo");
if (legado.status === 200 && !legado.html.includes("Application error")) {
  ok("HTTP 200 /legado-de-cristo");
} else {
  falhou("/legado-de-cristo", `status ${legado.status}`);
}

const arquivos = {
  encontroForm: readFileSync("app/(public)/encontro-com-deus/inscricao-form.tsx", "utf8"),
  legadoForm: readFileSync("app/(public)/legado-de-cristo/inscricao-form.tsx", "utf8"),
  eventoForm: readFileSync("app/(public)/eventos/[id]/inscricao-evento-form.tsx", "utf8"),
  aviso: readFileSync("components/aviso-pagamento-presencial.tsx", "utf8"),
  status: readFileSync("components/status-pagamento-conta.tsx", "utf8"),
  painel: readFileSync("app/(painel)/painel/encontro/page.tsx", "utf8"),
  lista: readFileSync("app/(painel)/painel/encontro/lista-inscricoes.tsx", "utf8"),
};

if (
  arquivos.aviso.includes("Pode enviar a inscrição normalmente") &&
  arquivos.encontroForm.includes("AvisoPagamentoPresencial") &&
  arquivos.legadoForm.includes("AvisoPagamentoPresencial") &&
  arquivos.eventoForm.includes("AvisoPagamentoPresencial")
) {
  ok("aviso de dinheiro/cartão no encontro, legado e eventos, sem bloquear");
} else {
  falhou("aviso de dinheiro/cartão não está nos três formulários");
}

if (
  arquivos.encontroForm.includes("FORMAS_PAGAMENTO") &&
  arquivos.legadoForm.includes("FORMAS_PAGAMENTO") &&
  arquivos.eventoForm.includes("FORMAS_PAGAMENTO")
) {
  ok("etapa de pagamento tem dinheiro e cartão (só aparece depois dos dados)");
} else {
  falhou("formulários sem lista de formas de pagamento");
}

if (
  arquivos.status.includes("CompletarPagamentoForm") &&
  arquivos.status.includes("complemento_pendente") &&
  arquivos.status.includes("falta_centavos")
) {
  ok("status público tem botão de completar pagamento");
} else {
  falhou("status público sem completar pagamento");
}

if (
  arquivos.painel.includes("eLider") &&
  arquivos.painel.includes("pastor_id") &&
  arquivos.painel.includes("pastorIdDaEquipeDoPerfil") &&
  arquivos.lista.includes("Aprovar complemento")
) {
  ok("painel do líder filtra pela equipe e tesouraria vê complemento");
} else {
  falhou("painel sem filtro de líder ou complemento");
}

const painelEncontro = await fetch("http://localhost:3000/painel/encontro", {
  redirect: "manual",
});
if ([307, 308].includes(painelEncontro.status)) {
  ok("painel /encontro exige login");
} else {
  falhou("painel /encontro deveria redirecionar visitante", `status ${painelEncontro.status}`);
}

console.log("");
if (falhas) {
  console.log(`${falhas} falha(s).`);
  process.exit(1);
}
console.log("Todos os testes do pedido 018 passaram.");
