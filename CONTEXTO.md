# Contexto do projeto — Ser Filho

Site da igreja **Ser Filho**. Stack: Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui + **Supabase** (Auth, Postgres, Storage, RLS). Deploy na **Vercel** a partir de `main`.

Este arquivo é a **memória longa** do projeto (o que mudou de verdade). Instruções curtas para a IA ficam em `AGENTS.md`. Como usar o fluxo de IA: `docs/FLUXO-IA.md`.

## Roles

Fonte de verdade: `lib/auth/roles.ts` (precisa bater com as funções SQL).

| Role | Quem é | Acesso |
| --- | --- | --- |
| `dev` | Admin técnico | Tudo |
| `tesouraria` | Tesouraria | Master: aprova pagamento, vê inscrições, planilha, admin |
| `apostolo` | Apóstolo(a) | Master + mídia |
| `lider_tesouraria` | Líder / Tesouraria | Inscrições, **aprova pagamento**, planilha da porta |
| `lider` | Líder | Inscrições da própria equipe pastoral |
| `pastor` | Pastor | Inscrições + admin usuários |
| `midia` | Líder de mídia | Eventos e testemunhos |
| `discipulo` | Discípulo | Conta sem painel |
| `pendente` | Aguardando aprovação | Sem painel |

## Funcionalidades no ar

1. **Células** — lista pública + gestão no painel (líder/pastor/master).
2. **Testemunhos / Eventos** — mídia publica; inscrição em eventos com pagamento.
3. **De Volta ao Jardim** — inscrição 2 etapas (dados + pagamento); painel de aprovação.
4. **Legado de Cristo** — mesmo padrão de inscrição/pagamento.
5. **Planilha de porta** — presença OK; filtros por papel/sexo.
6. **Admin usuários** — roles, excluir (pastor/apóstolo/tesouraria/dev), perfis fictícios (dev).
7. **Chave Pix da igreja** — editável no painel de inscrições; aparece nas páginas públicas.

## Pagamento (regra atual)

Arquivo: `lib/validations/pagamento-encontro.ts` (+ legado/evento).

- **Pix / débito / crédito:** comprovante obrigatório (cartão = foto da maquininha).
- **Dinheiro:** ir à mesa; pedir aprovação à Líder/Tesouraria ou Tesouraria.
- Status: `pendente` → aprovado/recusado pela equipe com `pode_aprovar_pagamento`.
- Chave Pix: RPC `obter_chave_pix` / `salvar_chave_pix` (migration `024_pix_e_aprovacao_lider_tesouraria.sql`).

## Estrutura (`app/`)

```
app/
  (public)/     início, células, eventos, encontro, legado, testemunhos
  (auth)/       login, cadastro, esqueci-senha, callback
  (painel)/     dashboard, encontro, legado, inscricoes-eventos,
                planilha-inscricoes, eventos, testemunhos, admin/usuarios
  api/inscricoes/  encontro, legado, evento, complemento
```

## Pastas-chave

- `components/` — header, `gradient-menu`, painel (`admin/sidebar`), formulários
- `lib/auth/` — roles e permissões
- `lib/igreja/` — chave Pix
- `lib/validations/` — regras de inscrição/pagamento
- `lib/ui/cores-marca.ts` — cores do menu público e accents do painel
- `supabase/migrations/` — `001` … `024` (rodar no SQL Editor do Supabase)

## UI / marca

- Fonte de cores: `lib/ui/cores-marca.ts` (`CORES_FLUIDO_MENU`, `CORES_PAINEL_NAV`) — **não trocar** por roxos de demos.
- Menu público e mobile: `GradientMenu` (círculo → pill com gradiente/glow no hover; item ativo mantém a cor).
  - Desktop: `PublicGradientNav` no `PublicHeader`.
  - Mobile: mesmo menu vertical no sheet (`PublicMobileMenu`).
  - Touch: 1º toque expande, 2º navega.
- Painel: `AdminSidebar` + `GradientMenu` vertical (`PainelNav`), mesmas cores de `CORES_PAINEL_NAV`.
- Componentes base: `components/ui/gradient-menu.tsx`, `components/site-header.tsx`, `components/admin/sidebar.tsx`.
- **Login:** visual Login10 (`components/auth/login10.tsx` + CSS) dentro de `AuthBrandShell`; no celular o formulário empilha.
- **Testemunhos (home `#testemunhos`):** só o carrossel 3D em cápsula (`testemunhos-home.tsx` + `testemunhos-featured.css` + `testemunhos-motion.tsx`). O card azul de detalhe foi **removido**.
- Homem/masculino → azul; mulher/feminino → rosa (`texto-com-sexo`).
- Apresentações em `presentation/`: evolução Git (`site-evolution.html` / `.pdf`) e guia de usuários (`guia-usuarios.html`).

## Segundo cérebro

- Obsidian: `Documents/mente site igrejas` — hub `Documentacao Ministerio Ser Filho.md`.
- Atualizar o cofre sempre que criar/remover feature (regra em `.cursor/rules/operacao-obsidian-oficial.mdc`).

## Lições caras (não repetir)

1. Depois de criar RPC no SQL, o PostgREST precisa recarregar schema (`notify pgrst` nas migrations).
2. Roles no TypeScript e no SQL precisam ser a **mesma lista** — divergência quebra RLS.
3. Comprovante: regra de negócio vive em `exigeComprovante()`; complementar no SQL do complemento.
4. Push para `main` = site oficial; só com pedido explícito do dono do projeto.
5. `CONTEXTO.md` desatualizado engana a IA — atualizar quando regras grandes mudarem.

## Fora de escopo deste arquivo

Não documentar aqui segredos (`.env.local`), chaves anon, nem senhas de teste.
