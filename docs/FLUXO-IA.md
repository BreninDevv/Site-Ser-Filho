# Fluxo de IA no Ser Filho — guia para humanos

Este guia existe para **você** (Aldo e quem for manter o site) entender o que foi instalado a partir do *Vibe Coding Toolkit* e como usar no dia a dia — **sem precisar do Claude Code**. Tudo aqui funciona no **Cursor**.

## Em uma frase

A IA deixa de “chutar e codar” e passa a seguir: **contexto → plano → mudança pequena → conferência → (se você pedir) commit/push**.

---

## O que cada peça é (e para que serve)

| Peça | Onde fica | Para que serve | Quando você usa |
| --- | --- | --- | --- |
| **AGENTS.md** | raiz do projeto | “Manual curto” que a IA lê sempre: stack, comandos, roles, o que não fazer | Automático em toda conversa no Cursor |
| **CLAUDE.md** | raiz | Só aponta para `AGENTS.md` (uma fonte só) | Automático |
| **CONTEXTO.md** | raiz | Memória longa: o que o site **é de verdade** hoje | Quando a regra de negócio mudar (PIX, roles, etc.) — peça “atualize o CONTEXTO” |
| **Rules** | `.cursor/rules/*.mdc` | Regras automáticas (base, ondas, SQL, pagamento, menu) | Automático; rules com `globs` só quando você edita aqueles arquivos |
| **Prompts** | `docs/ai-prompts/` | Textos prontos para colar no chat | Quando for faxina, review, feature grande, ou zerar lint |
| **Este arquivo** | `docs/FLUXO-IA.md` | Explicar o setup para humanos | Quando for ensinar alguém ou lembrar o fluxo |

---

## Fluxo do dia a dia (o que falar no chat)

### 1) Pedido pequeno (“muda a cor do botão”)
- Fale o pedido normal.
- A IA deve mudar só isso e, se fizer sentido, rodar typecheck/build.

### 2) Pedido médio (“chave Pix + cartão + dinheiro”)
Cole ou diga:
> Segue o fluxo brainstorm → plano: tire dúvidas, mostre o plano em passos verificáveis, só então implemente.

(Prompt completo em `docs/ai-prompts/04-brainstorm-ate-plano.md`.)

### 3) Várias coisas ao mesmo tempo
> Quebre em ondas paralelas: cada tarefa com Files e Depends-on; sem dois agentes no mesmo arquivo; você (agente principal) comita se eu pedir.

(Prompt: `05-ondas-paralelas.md`.)

### 4) Antes de subir pro oficial
> Faça review multi-agente do diff e me diga riscos. Depois, se eu pedir, commit e push em main.

(Prompt: `03-review-multi-agente.md`.)

### 5) Site “sujo” / confuso
> Rode sanitização: inventário com comandos reais, plano priorizado, só então mexer.

(Prompt: `01-sanitizacao.md`.)

---

## Comandos que você precisa saber (terminal)

Na pasta `Site-Ser-Filho`:

```powershell
npm install          # primeira vez / depois de puxar mudanças
npm run dev          # site local http://localhost:3000
npm run lint         # avisos/erros de qualidade
npx tsc --noEmit     # erros de TypeScript
npm run build        # igual à Vercel — se passar, costuma ir pro ar
git status
git push origin main # só quando quiser publicar (main = oficial)
```

**Supabase:** SQL Editor → colar migration nova → Run. Sem isso, RPC/tabela nova não existe no banco mesmo com o código no GitHub.

**Vercel:** push em `main` dispara o deploy. Espere 1–3 minutos e atualize o celular/PC (às vezes precisa limpar cache).

---

## O que NÃO veio do toolkit (de propósito)

- Não instalamos Claude Code CLI (você já usa Cursor).
- Não instalamos Graphify/RTK/aia-harness agora (opcional depois).
- Não misturamos isso com feature de igreja (PIX, inscrição) — isso é **processo**, não página nova.

---

## Como evoluir este setup no futuro

1. Mudou uma regra grande (ex.: quem aprova pagamento) → atualize `lib/auth/roles.ts` + SQL + `CONTEXTO.md` + `AGENTS.md` se a tabela de roles mudar.
2. Novo hábito bom da equipe → nova rule curta em `.cursor/rules/` (uma preocupação por arquivo).
3. Prompt que você repetiu 3 vezes → salve em `docs/ai-prompts/`.
4. Lição cara (“nunca faça X de novo”) → seção “Lições caras” do `CONTEXTO.md`.

---

## Checklist rápido “vou pedir uma feature”

- [ ] Eu expliquei o resultado desejado (não só a tecnologia)
- [ ] Se for grande: pedi plano antes
- [ ] Depois: pedi teste (build / página / painel)
- [ ] Se for pro ar: pedi commit + push explicitamente
- [ ] Se teve SQL: eu rodei a migration no Supabase
