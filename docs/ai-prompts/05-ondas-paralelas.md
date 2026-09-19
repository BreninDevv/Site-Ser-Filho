# Ondas paralelas

## Quando usar

Várias tarefas independentes (ex.: texto do menu + ajuste de CSS do painel + doc), para ir mais rápido sem um agente apagar o trabalho do outro.

## Como usar

Cole o prompt e revise a lista de Files antes de autorizar.

## Prompt

```
Split this Ser Filho work into parallel waves.

For every task provide:
- id
- Files: exact paths
- Depends-on: ids or none
- Done when: verifiable check

Wave rule: same wave only if no dependency and disjoint Files.
Implementers must not git commit; I (or the main agent) commit only if I ask.
If two tasks must touch the same file, put them in different waves.
```
