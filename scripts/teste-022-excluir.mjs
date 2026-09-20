/**
 * Teste pós-SQL 022: função de exclusão + regras de papel.
 * Não imprime secrets. Não apaga ninguém de verdade sem --apagar.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import {
  podeAdminUsuarios,
  podeExcluirEsteUsuario,
  podeExcluirUsuarios,
  podeAcessarRotaPainel,
} from "../lib/auth/roles.ts";

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
  console.error("FALHOU: .env.local sem URL/anon.");
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

console.log("=== Regras TypeScript ===");
for (const r of ["dev", "pastor", "apostolo", "tesouraria"]) {
  if (podeAdminUsuarios(r) && podeExcluirUsuarios(r)) ok(`${r} admin+excluir`);
  else falhou(`${r} admin+excluir`);
}
if (!podeAdminUsuarios("lider")) ok("lider sem admin");
else falhou("lider sem admin");

if (podeAcessarRotaPainel("pastor", "/painel/admin/usuarios"))
  ok("pastor acessa /painel/admin/usuarios");
else falhou("pastor acessa /painel/admin/usuarios");

if (podeAcessarRotaPainel("apostolo", "/painel/admin/usuarios"))
  ok("apostolo acessa admin");
else falhou("apostolo acessa admin");

if (podeAcessarRotaPainel("tesouraria", "/painel/admin/usuarios"))
  ok("tesouraria acessa admin");
else falhou("tesouraria acessa admin");

if (
  !podeExcluirEsteUsuario(
    { id: "p", role: "pastor" },
    { id: "a", role: "apostolo" }
  )
)
  ok("pastor nao exclui apostolo");
else falhou("pastor nao exclui apostolo");

if (
  podeExcluirEsteUsuario(
    { id: "a", role: "apostolo" },
    { id: "p", role: "pastor" }
  )
)
  ok("apostolo exclui pastor");
else falhou("apostolo exclui pastor");

if (
  podeExcluirEsteUsuario({ id: "d", role: "dev" }, { id: "t", role: "tesouraria" })
)
  ok("dev exclui tesouraria");
else falhou("dev exclui tesouraria");

console.log("\n=== Supabase SQL 022 ===");
const supabase = createClient(url, anon);

const fakeAlvo = "00000000-0000-4000-8000-000000000099";
const { error: rpcErro } = await supabase.rpc("excluir_usuario_painel", {
  alvo: fakeAlvo,
});

if (!rpcErro) {
  falhou(
    "RPC existe e exige auth",
    "chamada anon sem sessão não deveria ter sucesso"
  );
} else {
  const msg = (rpcErro.message || "").toLowerCase();
  const code = rpcErro.code || "";
  // Sem sessão: nao autenticado / JWT / permission / PGRST
  if (
    /nao autenticado|not authenticated|jwt|permission|pgrst|401|42501|function/i.test(
      `${msg} ${code} ${rpcErro.details || ""} ${rpcErro.hint || ""}`
    ) ||
    rpcErro.message
  ) {
    // Se a função NÃO existe, PostgREST tipicamente: "Could not find the function"
    if (/could not find the function|schema cache|does not exist/i.test(msg)) {
      falhou("RPC excluir_usuario_painel no banco", rpcErro.message);
    } else {
      ok(`RPC excluir_usuario_painel responde (${rpcErro.message})`);
    }
  }
}

const { data: podeFn, error: podeErro } = await supabase.rpc(
  "pode_excluir_usuarios"
);
if (podeErro) {
  const msg = (podeErro.message || "").toLowerCase();
  if (/could not find the function|does not exist/i.test(msg)) {
    falhou("RPC pode_excluir_usuarios no banco", podeErro.message);
  } else {
    ok(`pode_excluir_usuarios responde (${podeErro.message})`);
  }
} else {
  // Sem login costuma ser false
  ok(`pode_excluir_usuarios = ${podeFn}`);
}

const { data: pastores, error: pastorErro } = await supabase.rpc(
  "pastores_para_inscricao"
);
if (pastorErro) {
  falhou("pastores_para_inscricao", pastorErro.message);
} else {
  const n = Array.isArray(pastores) ? pastores.length : 0;
  if (n > 0) ok(`pastores_para_inscricao: ${n} pastor(es)`);
  else falhou("pastores_para_inscricao", "lista vazia (precisa role pastor + nome)");
}

console.log("\n=== Rotas produção ===");
const base = "https://site-ser-filho.vercel.app";
for (const rota of [
  "/login",
  "/inicio",
  "/encontro-com-deus",
  "/painel/admin/usuarios",
]) {
  try {
    const res = await fetch(`${base}${rota}`, { redirect: "manual" });
    const esperado =
      rota.startsWith("/painel") ? [307, 308, 302] : [200];
    if (esperado.includes(res.status)) ok(`${rota} → ${res.status}`);
    else falhou(`${rota}`, `status ${res.status}`);
  } catch (e) {
    falhou(rota, String(e));
  }
}

console.log(
  falhas
    ? `\nRESULTADO: ${falhas} falha(s)`
    : "\nRESULTADO: todos os testes automáticos passaram"
);
process.exit(falhas ? 1 : 0);
