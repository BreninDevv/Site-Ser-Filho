# ESLint — zerar avisos com segurança

## Quando usar

Quando `npm run lint` mostrar muitos warnings e você quiser limpar sem “refatorar o site inteiro”.

## Como usar

Cole o prompt e autorize onda por onda.

## Prompt

```
Burn down ESLint warnings in Site-Ser-Filho without silent refactors.

0) Run npm run lint and capture the real counts by rule.

1) Decision gate — answer before coding:
- Which rules are true bugs vs style?
- Which files are high-risk (auth, pagamento, supabase)?

2) Success criteria: npm run lint exits meaningfully cleaner; npx tsc --noEmit still passes.

3) Waves: group by rule or by folder; never mix payment/auth with cosmetic in the same wave.

4) Do not change business rules (exigeComprovante, roles, RLS) unless I explicitly ask.

5) After each wave: re-run lint and report remaining counts.
```
