# Review multi-agente

## Quando usar

Antes de publicar em `main` / Vercel, ou depois de um diff grande (pagamento, roles, SQL).

## Como usar

Cole o prompt com o escopo (“branch changes” ou “uncommitted”).

## Prompt

```
Run a multi-perspective review of the current Ser Filho changes.

Dispatch in parallel (read-only):
1) Correctness / regressions (forms, pagamento, painel)
2) Security (auth, roles, RLS, secrets)
3) Product/UX (mobile menu, copy in PT-BR)

Then synthesize:
- dedupe findings
- rank by severity
- say what must block push vs can wait

Do not commit or push unless I ask.
```
