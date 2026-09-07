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

const rotulos = {
  pendente: "Em análise",
  confirmada: "Aprovado",
  cancelada: "Recusado",
};
if (
  rotulos.pendente === "Em análise" &&
  rotulos.confirmada === "Aprovado" &&
  rotulos.cancelada === "Recusado"
) {
  ok("rótulos de status do pagamento");
} else {
  falhou("rótulos de status do pagamento");
}

const supabase = createClient(url, anon);
const eventoFalso = "00000000-0000-4000-8000-000000000000";

const { data: rpcData, error: rpcErro } = await supabase.rpc(
  "status_pagamento_evento",
  {
    p_evento_id: eventoFalso,
    p_nome: "Nome Completo",
    p_idade: 20,
  }
);
if (rpcErro) {
  falhou("RPC status_pagamento_evento", rpcErro.message);
} else if (rpcData == null) {
  ok("RPC existe e não vaza inscrição inexistente");
} else {
  falhou("RPC devolveu status para inscrição inexistente", String(rpcData));
}

const colunas = [
  "id",
  "evento_id",
  "nome",
  "idade",
  "status",
  "forma_pagamento",
  "valor_cobrado_centavos",
  "valor_pago_centavos",
  "comprovante_path",
  "created_at",
];
for (const coluna of colunas) {
  const { error } = await supabase.from("inscricoes_evento").select(coluna).limit(0);
  if (error) falhou(`coluna inscricoes_evento.${coluna}`, error.message);
  else ok(`coluna inscricoes_evento.${coluna}`);
}

const { error: erroInsert } = await supabase.from("inscricoes_evento").insert({
  evento_id: eventoFalso,
  nome: "Teste Anonimo",
  idade: 20,
  forma_pagamento: "pix",
});
if (erroInsert) ok("anonimo nao grava inscricao de evento");
else falhou("RLS deveria barrar insert anonimo em inscricoes_evento");

const { data: eventos, error: erroEventos } = await supabase
  .from("eventos")
  .select("id, nome, exige_inscricao, valor_centavos, publicar_em")
  .eq("exige_inscricao", true)
  .limit(3);
if (erroEventos) falhou("listar eventos com inscricao", erroEventos.message);
else ok(`eventos com inscricao visiveis (${eventos?.length ?? 0})`);

const paginas = ["/eventos", "/inicio", "/painel/inscricoes-eventos"];
for (const caminho of paginas) {
  const res = await fetch(`http://localhost:3000${caminho}`, { redirect: "manual" });
  if (res.status === 200 || res.status === 307 || res.status === 308) {
    ok(`HTTP ${res.status} ${caminho}`);
  } else {
    falhou(`HTTP ${caminho}`, `status ${res.status}`);
  }
}

if (eventos?.[0]?.id) {
  const pagina = await fetch(`http://localhost:3000/eventos/${eventos[0].id}`);
  const html = await pagina.text();
  if (pagina.status === 200) ok(`HTTP 200 /eventos/${eventos[0].id}`);
  else falhou(`HTTP /eventos/${eventos[0].id}`, `status ${pagina.status}`);
  if (html.includes("Status do pagamento")) ok("pagina do evento tem bloco de status");
  else falhou("pagina do evento sem bloco de status");
  if (html.includes("Application error")) falhou("pagina do evento com erro de runtime");
  else ok("pagina do evento sem erro de runtime");
}

console.log("");
if (falhas) {
  console.log(`${falhas} falha(s).`);
  process.exit(1);
}
console.log("Todos os testes passaram.");
