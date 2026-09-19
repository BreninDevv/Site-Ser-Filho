# Sanitização do projeto

## Quando usar (português)

Quando o site estiver confuso, com arquivos mortos, avisos demais, ou você não souber por onde começar a “limpar”.

## Como usar

1. Abra o chat do Cursor no projeto Ser Filho.
2. Cole o bloco **Prompt** abaixo.
3. Peça para a IA **só inventariar** primeiro; só autorize correções depois.

## Prompt

```
You are cleaning up the Ser Filho repo (Next.js + Supabase).

0) Ground truth — run now, do not estimate:
- npm run lint
- npx tsc --noEmit
- npm run build
- git status

1) Inventory only (do not fix yet):
- dead/demo files, outdated docs, duplicate payment rules, risky TODOs
- list each finding with file path and severity (safe / needs human sign-off)

2) Prioritized plan:
- safe mechanical fixes first
- anything touching auth, RLS, payments, or migrations needs my OK before edits

3) Wait for my go-ahead before changing code.
```
