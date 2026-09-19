/**
 * Gera presentation/site-evolution.pdf a partir do histórico Git.
 * Worktrees isoladas → build → screenshots desktop/mobile → PDF.
 */
import { spawn, execSync, execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  cpSync,
  rmSync,
  readdirSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "presentation");
const ASSETS = join(OUT, "assets");
const WORK = join(ROOT, ".presentation-worktrees");

/** Marcos da evolução (ordem cronológica). */
const MILESTONES = [
  { hash: "216037d", route: "/", label: "feat: início do projeto Next.js" },
  { hash: "00c419c", route: "/celulas", label: "feat: células quase prontas na home pública" },
  { hash: "3b6e31a", route: "/encontro-com-deus", label: "feat: inscrição pública do Encontro + painel" },
  { hash: "cab5248", route: "/encontro-com-deus", label: "feat: pagamento do Encontro (etapa 2, comprovante, aprovação)" },
  { hash: "d495887", route: "/legado-de-cristo", label: "feat: inscrição e painel do Legado de Cristo" },
  { hash: "1402a7d", route: "/eventos", label: "feat: eventos, testemunhos, role mídia e blindagem" },
  { hash: "e179f6e", route: "/inicio", label: "feat: globo, reels, inscrição de eventos e status de pagamento" },
  { hash: "6a82274", route: "/inicio", label: "feat: role Líder/Tesouraria + planilha de chegada + Excel" },
  { hash: "4155776", route: "/inicio", label: "design: sidebar colapsável do painel com permissões" },
  { hash: "fc14b52", route: "/encontro-com-deus", label: "feat: chave Pix, foto da maquininha e aprovação Líder/Tesouraria" },
  { hash: "04e6899", route: "/inicio", label: "design: menu do celular com cores de cada página" },
  { hash: "a5c053f", route: "/inicio", label: "update: fluxo de IA (memória, rules, prompts e guia)" },
];

function sh(cmd, cwd = ROOT) {
  return execSync(cmd, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  }).trim();
}

/** Git sem shell — no Windows o cmd engole %H %ad do --format. */
function git(args, cwd = ROOT) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  }).trim();
}

function ensureDeps() {
  const pw = join(ROOT, "node_modules", "playwright");
  if (!existsSync(pw)) {
    console.log("Instalando playwright…");
    sh("npm install -D playwright@1.55.0 --no-fund --no-audit");
  }
  try {
    sh("npx playwright install chromium");
  } catch {
    /* ok se já instalado */
  }
}

function fullHash(short) {
  return git(["rev-parse", short]);
}

function commitMeta(hash) {
  const raw = git([
    "show",
    "-s",
    "--format=%H|%ad|%an|%s",
    "--date=short",
    hash,
  ]);
  const [full, date, author, ...rest] = raw.split("|");
  const subject = rest.join("|");
  let stats = { files: 0, insertions: 0, deletions: 0 };
  try {
    const num = git(["show", "--numstat", "--format=", hash]);
    for (const line of num.split(/\r?\n/).filter(Boolean)) {
      const [a, d] = line.split("\t");
      if (a === "-" || d === "-") continue;
      stats.files += 1;
      stats.insertions += Number(a) || 0;
      stats.deletions += Number(d) || 0;
    }
  } catch {
    /* */
  }
  return { full, date, author, subject, stats };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(url, timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.status > 0) return true;
    } catch {
      /* */
    }
    await sleep(1500);
  }
  return false;
}

function killPort(port) {
  try {
    if (process.platform === "win32") {
      const out = execSync(`netstat -ano | findstr :${port}`, {
        encoding: "utf8",
        windowsHide: true,
      });
      const pids = new Set();
      for (const line of out.split(/\r?\n/)) {
        const m = line.trim().match(/(\d+)\s*$/);
        if (m && m[1] !== "0") pids.add(m[1]);
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { windowsHide: true });
        } catch {
          /* */
        }
      }
    }
  } catch {
    /* porta livre */
  }
}

function spawnNext(cwd, args, opts) {
  const nextBin = join(cwd, "node_modules", "next", "dist", "bin", "next");
  if (existsSync(nextBin)) {
    return spawn(process.execPath, [nextBin, ...args], {
      ...opts,
      windowsHide: true,
    });
  }
  return spawnNpx(["next", ...args], opts);
}

function spawnNpm(args, opts) {
  const isWin = process.platform === "win32";
  return spawn(isWin ? "npm.cmd" : "npm", args, {
    ...opts,
    shell: isWin,
    windowsHide: true,
  });
}

function spawnNpx(args, opts) {
  const isWin = process.platform === "win32";
  return spawn(isWin ? "npx.cmd" : "npx", args, {
    ...opts,
    shell: isWin,
    windowsHide: true,
  });
}

async function captureCommit(playwright, milestone, index, total) {
  const { hash, route, label } = milestone;
  const full = fullHash(hash);
  const meta = commitMeta(hash);
  const dir = join(ASSETS, hash);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "meta.json"),
    JSON.stringify({ ...milestone, ...meta, label }, null, 2)
  );

  const desktopPath = join(dir, "desktop.png");
  const mobilePath = join(dir, "mobile.png");
  if (existsSync(desktopPath) && existsSync(mobilePath)) {
    console.log(`[${index + 1}/${total}] ${hash} — screenshots já existem`);
    return { ok: true, meta, label, hash, skipped: true };
  }

  const head = git(["rev-parse", "HEAD"]);
  const port = 3200 + index;

  let child = null;
  let cwd = ROOT;
  let wt = null;

  try {
    if (full === head) {
      console.log(`[${index + 1}/${total}] ${hash} — HEAD atual (sem worktree)`);
      if (!existsSync(join(ROOT, ".next"))) {
        console.log("  build HEAD…");
        sh("npm run build", ROOT);
      }
      cwd = ROOT;
    } else {
      wt = join(WORK, hash);
      console.log(`[${index + 1}/${total}] ${hash} — worktree + build…`);
      if (existsSync(wt)) {
        try {
          git(["worktree", "remove", "-f", wt]);
        } catch {
          rmSync(wt, { recursive: true, force: true });
        }
      }
      git(["worktree", "add", "--detach", wt, full]);
      cwd = wt;
      const envSrc = join(ROOT, ".env.local");
      if (existsSync(envSrc)) cpSync(envSrc, join(wt, ".env.local"));
      console.log(`  npm install…`);
      sh("npm install --no-fund --no-audit", wt);
      console.log(`  npm run build…`);
      try {
        sh("npm run build", wt);
      } catch (e) {
        console.warn(`  build falhou, tentando dev: ${(e.message || "").slice(0, 100)}`);
      }
    }

    killPort(port);
    console.log(`  start :${port}…`);
    const hasBuild = existsSync(join(cwd, ".next"));
    child = hasBuild
      ? spawnNext(cwd, ["start", "-p", String(port)], {
          cwd,
          env: { ...process.env, PORT: String(port) },
          stdio: "ignore",
        })
      : spawnNext(cwd, ["dev", "-p", String(port)], {
          cwd,
          env: { ...process.env, PORT: String(port) },
          stdio: "ignore",
        });

    const base = `http://127.0.0.1:${port}`;
    let up = await waitForServer(base, 90000);
    if (!up && hasBuild) {
      if (child) {
        try {
          child.kill();
        } catch {
          /* */
        }
      }
      killPort(port);
      child = spawnNext(cwd, ["dev", "-p", String(port)], {
        cwd,
        env: { ...process.env, PORT: String(port) },
        stdio: "ignore",
      });
      up = await waitForServer(base, 120000);
    }
    if (!up) throw new Error("servidor não subiu");

    const browser = await playwright.launch({ headless: true });
    const url = `${base}${route}`;

    const desk = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
    });
    await desk.goto(url, { waitUntil: "networkidle", timeout: 90000 }).catch(() =>
      desk.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 })
    );
    await sleep(2000);
    await desk.screenshot({ path: desktopPath, fullPage: true });
    await desk.close();

    const mob = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await mob.goto(url, { waitUntil: "networkidle", timeout: 90000 }).catch(() =>
      mob.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 })
    );
    await sleep(2000);
    await mob.screenshot({ path: mobilePath, fullPage: true });
    await mob.close();
    await browser.close();

    console.log(`  ok screenshots`);
    return { ok: true, meta, label, hash };
  } catch (e) {
    console.warn(`  falha ${hash}: ${e.message || e}`);
    writeFileSync(join(dir, "error.txt"), String(e.stack || e));
    return { ok: false, meta, label, hash, error: String(e.message || e) };
  } finally {
    if (child) {
      try {
        child.kill("SIGTERM");
      } catch {
        /* */
      }
    }
    killPort(port);
    if (wt) {
      try {
        git(["worktree", "remove", "-f", wt]);
      } catch {
        try {
          rmSync(wt, { recursive: true, force: true });
          git(["worktree", "prune"]);
        } catch {
          /* */
        }
      }
    }
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(results) {
  const ok = results.filter((r) => r.ok && existsSync(join(ASSETS, r.hash, "desktop.png")));
  const total = ok.length;
  const igreja = "Ser Filho";
  const data = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const slides = [];

  slides.push(`
  <section class="slide cover">
    <div class="cover-inner">
      <p class="eyebrow">Apresentação automática · Git</p>
      <h1>Evolução do Site da Igreja<br/>${escapeHtml(igreja)}</h1>
      <p class="sub">${escapeHtml(data)}</p>
      <p class="meta">${total} marcos · gerado a partir do histórico</p>
    </div>
    <div class="progress">Capa</div>
  </section>`);

  ok.forEach((r, i) => {
    const prev = i > 0 ? ok[i - 1] : null;
    const desk = `assets/${r.hash}/desktop.png`;
    const mob = `assets/${r.hash}/mobile.png`;
    const hasMob = existsSync(join(ASSETS, r.hash, "mobile.png"));
    const st = r.meta.stats || {};
    slides.push(`
    <section class="slide">
      <header>
        <span class="hash">${escapeHtml(r.hash)}</span>
        <span class="date">${escapeHtml(r.meta.date || "")}</span>
      </header>
      <h2>${escapeHtml(r.label)}</h2>
      <p class="legend">${escapeHtml(r.meta.subject)}</p>
      ${
        prev
          ? `<p class="before">Em relação a <code>${escapeHtml(prev.hash)}</code>: +${st.insertions || 0} / −${st.deletions || 0} em ${st.files || 0} arquivos</p>`
          : `<p class="before">Marco inicial desta linha do tempo</p>`
      }
      <div class="shots ${hasMob ? "duo" : "solo"}">
        <figure>
          <img src="${desk}" alt="Desktop ${r.hash}" />
          <figcaption>Desktop 1920×1080</figcaption>
        </figure>
        ${
          hasMob
            ? `<figure class="mobile">
          <img src="${mob}" alt="Mobile ${r.hash}" />
          <figcaption>Mobile 390×844</figcaption>
        </figure>`
            : ""
        }
      </div>
      <div class="progress">Commit ${i + 1} de ${total}</div>
    </section>`);
  });

  const rows = ok
    .map(
      (r, i) => `
    <div class="tl-item">
      <div class="tl-dot"></div>
      <div class="tl-body">
        <strong>${i + 1}. ${escapeHtml(r.hash)}</strong>
        <span>${escapeHtml(r.meta.date || "")}</span>
        <p>${escapeHtml(r.label)}</p>
        <small>${r.meta.stats?.files || 0} arquivos · +${r.meta.stats?.insertions || 0} −${r.meta.stats?.deletions || 0}</small>
      </div>
    </div>`
    )
    .join("");

  const sumFiles = ok.reduce((a, r) => a + (r.meta.stats?.files || 0), 0);
  const sumIns = ok.reduce((a, r) => a + (r.meta.stats?.insertions || 0), 0);
  const sumDel = ok.reduce((a, r) => a + (r.meta.stats?.deletions || 0), 0);

  slides.push(`
  <section class="slide finale">
    <h2>Linha do tempo</h2>
    <div class="metrics">
      <div><strong>${total}</strong><span>marcos</span></div>
      <div><strong>${sumFiles}</strong><span>arquivos tocados*</span></div>
      <div><strong>+${sumIns}</strong><span>linhas adicionadas*</span></div>
      <div><strong>−${sumDel}</strong><span>linhas removidas*</span></div>
    </div>
    <p class="note">*Soma dos diffs dos marcos selecionados (não do repositório inteiro).</p>
    <div class="timeline">${rows}</div>
    <div class="progress">Fim</div>
  </section>`);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Evolução do Site — ${escapeHtml(igreja)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; font-family: Inter, system-ui, sans-serif; color: #0b1f33; background: #fff; }
  .slide {
    width: 1280px; height: 720px; padding: 48px 56px 64px;
    page-break-after: always; break-after: page;
    position: relative; overflow: hidden;
    background: #ffffff;
  }
  .cover { display: flex; align-items: center; background: #0b1f33; color: #fff; }
  .cover-inner { max-width: 900px; }
  .eyebrow { letter-spacing: .12em; text-transform: uppercase; font-size: 12px; opacity: .7; }
  .cover h1 { font-size: 42px; line-height: 1.15; font-weight: 700; margin: 16px 0; }
  .cover .sub { font-size: 18px; opacity: .85; }
  .cover .meta { margin-top: 32px; font-size: 14px; opacity: .6; }
  header { display: flex; justify-content: space-between; color: #5a6b7d; font-size: 13px; margin-bottom: 8px; }
  h2 { font-size: 26px; margin: 0 0 8px; color: #0b1f33; font-weight: 650; }
  .legend { color: #3d4f61; font-size: 15px; margin: 0 0 8px; }
  .before { color: #5a6b7d; font-size: 13px; margin: 0 0 16px; }
  .shots { display: grid; gap: 16px; align-items: start; }
  .shots.duo { grid-template-columns: 1.4fr 0.7fr; }
  .shots.solo { grid-template-columns: 1fr; }
  figure { margin: 0; }
  figure img {
    width: 100%; max-height: 420px; object-fit: cover; object-position: top;
    border: 1px solid #d5dee8; border-radius: 8px; background: #f4f7fa;
  }
  figure.mobile img { max-height: 420px; object-fit: contain; background: #0b1f33; }
  figcaption { font-size: 11px; color: #5a6b7d; margin-top: 6px; }
  .progress {
    position: absolute; left: 56px; right: 56px; bottom: 28px;
    font-size: 12px; color: #5a6b7d;
    border-top: 2px solid #e6eef6; padding-top: 10px;
  }
  .finale .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
  .finale .metrics div {
    background: #f4f7fa; border: 1px solid #d5dee8; border-radius: 8px;
    padding: 14px; text-align: center;
  }
  .finale .metrics strong { display: block; font-size: 22px; color: #0b1f33; }
  .finale .metrics span { font-size: 12px; color: #5a6b7d; }
  .note { font-size: 11px; color: #5a6b7d; }
  .timeline { max-height: 380px; overflow: hidden; margin-top: 8px; }
  .tl-item { display: grid; grid-template-columns: 16px 1fr; gap: 12px; margin-bottom: 10px; }
  .tl-dot { width: 10px; height: 10px; border-radius: 50%; background: #0b1f33; margin-top: 5px; }
  .tl-body strong { font-size: 13px; }
  .tl-body span { margin-left: 8px; color: #5a6b7d; font-size: 12px; }
  .tl-body p { margin: 2px 0; font-size: 13px; }
  .tl-body small { color: #5a6b7d; }
  code { font-size: 12px; background: #f4f7fa; padding: 1px 5px; border-radius: 4px; }
</style>
</head>
<body>
${slides.join("\n")}
</body>
</html>`;
}

async function main() {
  mkdirSync(ASSETS, { recursive: true });
  mkdirSync(WORK, { recursive: true });
  ensureDeps();
  const { chromium } = require("playwright");

  const results = [];
  for (let i = 0; i < MILESTONES.length; i++) {
    const r = await captureCommit(chromium, MILESTONES[i], i, MILESTONES.length);
    results.push(r);
  }

  writeFileSync(join(OUT, "timeline.json"), JSON.stringify(results, null, 2));

  const html = buildHtml(results);
  const htmlPath = join(OUT, "site-evolution.html");
  writeFileSync(htmlPath, html, "utf8");

  console.log("Gerando PDF…");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`file://${htmlPath.replace(/\\/g, "/")}`, {
    waitUntil: "networkidle",
  });
  await page.pdf({
    path: join(OUT, "site-evolution.pdf"),
    width: "1280px",
    height: "720px",
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  });
  await browser.close();

  try {
    git(["worktree", "prune"]);
  } catch {
    /* */
  }

  console.log("Pronto:", join(OUT, "site-evolution.pdf"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
