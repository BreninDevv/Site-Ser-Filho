<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Ser Filho — instruções para agentes de IA

Memória curta e de alto sinal. Detalhes de negócio e histórico ficam em `CONTEXTO.md`.
Prompts prontos para colar: `docs/ai-prompts/`.
Como usar este setup: `docs/FLUXO-IA.md`.

## Comportamento

1. **Pense antes de codar** — declare premissas. Se houver várias interpretações, mostre; não escolha em silêncio.
2. **Simplicidade primeiro** — mínimo de código que resolve. Sem feature especulativa, sem abstração para uso único.
3. **Mudança cirúrgica** — toque só o que o pedido exige. Preserve estilo local.
4. **Meta verificável** — cada passo deve ter um jeito de conferir (build, tsc, smoke de rota, SQL rodado).
5. **Orquestrador** — em tarefas grandes, planeje e delegue; não misture dois agentes no mesmo arquivo na mesma onda.

## Stack

- TypeScript · Next.js 16 (App Router) · React 19 · Tailwind v4 · shadcn/ui
- Supabase (Auth + Postgres + Storage + RLS + RPCs)
- Deploy: Vercel (`main` → produção)
- Pacotes: `npm`

## Comandos canônicos

Use exatamente estes — não invente:

- **Instalar:** `npm install`
- **Dev:** `npm run dev`
- **Lint:** `npm run lint`
- **Typecheck:** `npx tsc --noEmit`
- **Build:** `npm run build`
- **Start (após build):** `npm run start`

## Roles (fonte: `lib/auth/roles.ts`)

| Role | Painel / poder |
| --- | --- |
| `dev` | Tudo |
| `tesouraria` / `apostolo` | Master (aprova pagamento, admin parcial) |
| `lider_tesouraria` | Vê inscrições, aprova pagamento, planilha da porta |
| `lider` / `pastor` | Veem inscrições (líder só da equipe); pastor admin usuários |
| `midia` | Eventos / testemunhos |
| `discipulo` / `pendente` | Sem painel (ou aguardando) |

Quem **aprova pagamento**: `dev`, `tesouraria`, `apostolo`, `lider_tesouraria`.

## Pagamento (regra atual)

- Pix e cartão (débito/crédito): comprovante obrigatório
- Dinheiro: mesa de inscrição; aprovação presencial
- Chave Pix: tabela `configuracoes_igreja` via RPCs `obter_chave_pix` / `salvar_chave_pix` (migration `024`)

## SQL / Supabase

- Migrations em `supabase/migrations/` — numeradas; rodar no SQL Editor na ordem
- Depois de criar/alterar função RPC: `notify pgrst, 'reload schema';` (já costuma estar nas migrations)
- Nunca inventar nome de RPC ou coluna: conferir migration + código em `lib/`

## Rotas importantes

- Público: `/inicio`, `/celulas`, `/eventos`, `/encontro-com-deus`, `/legado-de-cristo`
- Auth: `/login`, `/cadastro`, `/auth/callback`
- Painel: `/painel`, `/painel/encontro`, `/painel/legado`, `/painel/inscricoes-eventos`, `/painel/planilha-inscricoes`, `/painel/admin/usuarios`

## Especialistas (quando delegar)

| Quando | Preferir |
| --- | --- |
| UI / formulários / menu | agente front |
| RLS, RPC, migration | agente backend/SQL |
| Auth, roles, exclusão de usuário | revisão de segurança |
| Diff grande antes de push | code-reviewer / Bugbot |
| Vários pedaços independentes | ondas paralelas (ver regra Cursor) |

## Não fazer

- Commit/push sem o usuário pedir (exceto quando ele pedir explicitamente publicar)
- Service role no client
- Expandir escopo além do pedido
- Deixar `CONTEXTO.md` mentir sobre o estado do projeto
