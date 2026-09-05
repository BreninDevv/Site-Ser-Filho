# Contexto do projeto — Ser Filho

Site da igreja **Ser Filho**, em Next.js (App Router + TypeScript + Tailwind + shadcn/ui). Backend previsto: **Supabase** (Postgres + Auth + Storage). Neste momento **não** há autenticação, banco nem regras de permissão implementadas — só estrutura de pastas, UI base e páginas-esqueleto para navegação.

## Roles (tipos de usuário)

| Role | Quem é | Acesso previsto |
| --- | --- | --- |
| `dev` | Desenvolvimento / admin técnico | Acesso total, inclusive `admin/` (usuários e roles) |
| `lider` | Líderes e pastores | Cadastrar e gerir conteúdo (células, inscrições do Encontro) |
| `visitante` | Público | Sem conta na maior parte do site; só visualiza páginas públicas e pode se inscrever no Encontro |

## Funcionalidades principais

1. **Células** — Pequenos grupos em casas. Cadastradas por líderes/pastores (local, dia, horário, descrição). Visitantes só visualizam a lista pública.
2. **Testemunhos** — Página com vídeos/gifs. Sem regra de permissão especial.
3. **Encontro com Deus** — Evento recorrente. Inscrição pública de visitantes; painel para líder/dev controlarem inscritos (presença, status).

## Estrutura de pastas (`app/`)

Route groups do App Router (os parênteses **não** entram na URL):

```
app/
  layout.tsx                          # layout raiz
  (public)/                           # páginas públicas
    page.tsx                          # /  (home)
    celulas/page.tsx                  # /celulas
    testemunhos/page.tsx              # /testemunhos
    encontro-com-deus/page.tsx        # /encontro-com-deus  (inscrição pública)
  (auth)/                             # autenticação (esqueleto)
    login/page.tsx                    # /login
    cadastro/page.tsx                 # /cadastro
  (painel)/                           # área logada líder/dev (esqueleto)
    painel/page.tsx                   # /painel  (dashboard)
    painel/celulas/page.tsx           # /painel/celulas
    painel/encontro/page.tsx          # /painel/encontro  (gestão de inscrições)
    painel/admin/usuarios/page.tsx    # /painel/admin/usuarios  (só dev, no futuro)
```

## Outras pastas

- `components/` — UI compartilhada (`ui/` do shadcn, header público, nav do painel).
- `lib/supabase/` — cliente e helpers do Supabase (vazio por enquanto).
- `lib/auth/` — sessão, roles e guards (vazio por enquanto).
- `lib/validations/` — schemas de formulário (vazio por enquanto).
- `lib/utils.ts` — `cn()` do shadcn.

## UI

- **shadcn/ui** com estilo `radix-nova`, **tema base `neutral`**, CSS variables, Tailwind v4.
- Sem identidade visual da igreja ainda (cores institucionais entram depois).

## Fora de escopo agora

Não implementar: login real, RLS, cadastro de células, player de testemunhos, formulário de inscrição, checagem de role nas rotas do painel.
