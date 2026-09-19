# Bootstrap de memória

## Quando usar

Projeto novo, ou quando `CONTEXTO.md` / `AGENTS.md` estiverem velhos demais.

## Como usar

Cole após uma feature grande ou no início de um ciclo.

## Prompt

```
Refresh Ser Filho AI memory in two tiers:

Tier 1 (always loaded): AGENTS.md — short, commands, roles table, hard don'ts.
Tier 2 (long memory): CONTEXTO.md — current features, payment rules, migration lessons.

Rules:
- Only save expensive-to-relearn facts (not every commit).
- Keep AGENTS.md small; move narrative to CONTEXTO.md.
- Never put secrets from .env.local into either file.
- After updating, summarize what changed for the human in Portuguese.
```
