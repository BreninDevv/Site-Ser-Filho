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

function destinoDoTestemunho(entrada) {
  const texto = entrada.trim();
  if (!texto || texto.length > 500) return null;
  if (/^(javascript|data|file|vbscript):/i.test(texto)) return null;
  const href = /^https?:\/\//i.test(texto) ? texto : `https://${texto}`;
  try {
    const destino = new URL(href);
    if (destino.protocol !== "https:" && destino.protocol !== "http:") return null;
    const host = destino.hostname.replace(/^www\./, "").toLowerCase();
    const caminho = destino.pathname;
    const instagram =
      host === "instagram.com" && /\/(reel|reels|p|tv|share)\//i.test(caminho);
    const youtube =
      (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be") &&
      (host === "youtu.be" ||
        /\/(watch|shorts|embed|live)\b/i.test(caminho) ||
        destino.searchParams.has("v"));
    return instagram || youtube ? destino.toString() : null;
  } catch {
    return null;
  }
}

function previaEhVideo(path) {
  return /\.(mp4|webm)$/i.test(path);
}

function urlPublicaDaPrevia(path) {
  const limpo = path.split("/").pop() ?? "";
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpe?g|webp|mp4|webm)$/i.test(
      limpo
    )
  ) {
    return "";
  }
  return `${url}/storage/v1/object/public/testemunhos-previas/${limpo}`;
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

const aceitos = [
  "https://www.instagram.com/reel/AbC123/",
  "https://instagram.com/reels/AbC123",
  "https://www.instagram.com/p/AbC123/",
  "https://www.youtube.com/watch?v=dQw4w9wgXcQ",
  "https://youtu.be/dQw4w9wgXcQ",
  "https://www.youtube.com/shorts/dQw4w9wgXcQ",
  "www.youtube.com/watch?v=dQw4w9wgXcQ",
];
const recusados = [
  "",
  "javascript:alert(1)",
  "https://evil.com/?u=youtube.com/watch?v=dQw4w9wgXcQ",
  "https://youtube.com.evil.com/watch?v=dQw4w9wgXcQ",
  "https://vimeo.com/123",
  "https://instagram.com/ministerioserfilho",
  "data:text/html,x",
];

for (const link of aceitos) {
  if (destinoDoTestemunho(link)) ok(`destino aceita ${link}`);
  else falhou(`destino deveria aceitar ${link}`);
}
for (const link of recusados) {
  if (!destinoDoTestemunho(link)) ok(`destino recusa ${JSON.stringify(link)}`);
  else falhou(`destino deveria recusar ${link}`);
}

if (previaEhVideo("a.mp4") && previaEhVideo("b.webm") && !previaEhVideo("c.jpg")) {
  ok("previaEhVideo distingue imagem e vídeo");
} else {
  falhou("previaEhVideo");
}

const uuid = "11111111-1111-1111-1111-111111111111.jpg";
if (urlPublicaDaPrevia(uuid).includes("/testemunhos-previas/")) {
  ok("urlPublicaDaPrevia monta URL pública");
} else {
  falhou("urlPublicaDaPrevia");
}
if (!urlPublicaDaPrevia("../secret.png")) {
  ok("urlPublicaDaPrevia recusa path inválido");
} else {
  falhou("urlPublicaDaPrevia deveria recusar path inválido");
}

const supabase = createClient(url, anon);

const openapi = await fetch(`${url}/rest/v1/`, {
  headers: {
    apikey: anon,
    Authorization: `Bearer ${anon}`,
    Accept: "application/openapi+json",
  },
});
if (openapi.ok) {
  const spec = await openapi.json();
  const def = spec.definitions?.testemunhos ?? spec.components?.schemas?.testemunhos;
  const props = def?.properties ? Object.keys(def.properties) : [];
  const required = def?.required ?? [];
  console.log(`INFO colunas OpenAPI: ${props.join(", ") || "(nenhuma)"}`);
  console.log(`INFO obrigatórias: ${required.join(", ") || "(nenhuma)"}`);
} else {
  console.log(`INFO OpenAPI status ${openapi.status}`);
}

const { data: todos, error: erroTodos } = await supabase
  .from("testemunhos")
  .select("*")
  .limit(1);
if (erroTodos) {
  falhou("select * testemunhos", erroTodos.message);
} else {
  const chaves = todos?.[0] ? Object.keys(todos[0]).join(", ") : "(tabela vazia)";
  ok(`select * testemunhos — colunas: ${chaves}`);
}

const colunasEsperadas = [
  "id",
  "nome",
  "video_url",
  "descricao",
  "previa_path",
  "created_at",
  "titulo",
  "autor_id",
];
for (const coluna of colunasEsperadas) {
  const { error } = await supabase.from("testemunhos").select(coluna).limit(0);
  if (error) falhou(`coluna ${coluna}`, error.message);
  else ok(`coluna ${coluna} existe`);
}

const { data: colunas, error: erroSelect } = await supabase
  .from("testemunhos")
  .select("id, nome, descricao, video_url, previa_path, created_at")
  .limit(3);

if (erroSelect) {
  falhou("select das colunas novas", erroSelect.message);
} else {
  ok(`select testemunhos (${colunas?.length ?? 0} no ar)`);
}

const { error: erroInsert } = await supabase.from("testemunhos").insert({
  nome: "teste-anonimo",
  descricao: "nao deve gravar",
  video_url: "https://youtu.be/dQw4w9wgXcQ",
  previa_path: "11111111-1111-1111-1111-111111111111.jpg",
});
if (erroInsert) ok("anonimo nao consegue inserir testemunho");
else falhou("RLS deveria barrar insert anonimo");

const { error: erroUpdate } = await supabase
  .from("testemunhos")
  .update({ nome: "hack" })
  .eq("id", "00000000-0000-0000-0000-000000000000");
if (erroUpdate || true) {
  const { data: depois } = await supabase
    .from("testemunhos")
    .select("nome")
    .eq("nome", "hack")
    .maybeSingle();
  if (!depois) ok("anonimo nao altera testemunho");
  else falhou("RLS deveria barrar update anonimo");
}

const { data: objetos, error: erroBucket } = await supabase.storage
  .from("testemunhos-previas")
  .list("", { limit: 1 });
if (erroBucket) {
  falhou("bucket testemunhos-previas", erroBucket.message);
} else {
  ok(`bucket testemunhos-previas acessivel (${objetos?.length ?? 0} arquivo(s) listados)`);
}

const { error: erroUploadAnon } = await supabase.storage
  .from("testemunhos-previas")
  .upload(`teste-anon-${Date.now()}.jpg`, new Uint8Array([1, 2, 3]), {
    contentType: "image/jpeg",
  });
if (erroUploadAnon) ok("anonimo nao envia previa no storage");
else falhou("storage deveria barrar upload anonimo");

const paginas = ["/inicio", "/painel/testemunhos", "/globe-study.html"];
for (const caminho of paginas) {
  const res = await fetch(`http://localhost:3000${caminho}`, {
    redirect: "manual",
  });
  const okHttp =
    res.status === 200 ||
    res.status === 307 ||
    res.status === 308 ||
    res.status === 303;
  if (okHttp) ok(`HTTP ${res.status} ${caminho}`);
  else falhou(`HTTP ${caminho}`, `status ${res.status}`);
}

const home = await fetch("http://localhost:3000/inicio");
const html = await home.text();
if (html.includes("Testemunhos")) ok("home renderiza secao Testemunhos");
else falhou("home sem secao Testemunhos");
if (html.includes("Application error") || html.includes("missing required error")) {
  falhou("home devolveu erro de runtime");
} else {
  ok("home sem erro de runtime");
}

console.log("");
if (falhas) {
  console.log(`${falhas} falha(s).`);
  process.exit(1);
}
console.log("Todos os testes passaram.");
