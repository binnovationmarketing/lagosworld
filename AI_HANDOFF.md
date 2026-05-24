# AI HANDOFF — Estado Vivo do Projeto

> Atualize este arquivo antes de trocar entre Claude Code e Codex.

## Estado Atual

- Projeto: Lagos World
- Repositorio: `binnovationmarketing/lagosworld`
- Branch atual esperado: `main` ou worktree baseado em `origin/main`
- Produção: `https://lagosworld.app`
- Health check: `https://lagosworld.app/api/health`
- Stack: HTML/CSS/JS puro + Express + Supabase + Nodemailer + Vercel

## Ultimo Estado Confirmado

- `origin/main` inclui a documentacao de replicacao:
  - `PROJECT_BLUEPRINT.md`
  - `REPLICATION_GUIDE.md`
  - `COMPONENT_MAP.md`
  - `BUSINESS_TEMPLATE.md`
  - `CLAUDE_REBUILD_PROMPT.md`
  - `EXECUTIVE_SUMMARY.md`
  - `START_NEW_PROJECT.md`
  - `TEMPLATE_REFACTOR_PLAN.md`
  - `PRINCIPLES.md`
- Deploy/API confirmado em producao:
  - `GET https://lagosworld.app/api/health`
  - resposta esperada: `{"status":"ok","message":"Lagos Platform API running"}`
- Notion criado:
  - `🏗️ Como Criar um Negócio do Zero — Claude Code + Supabase + Vercel`
  - URL: `https://www.notion.so/36ad8cec1ce281428ae4dc0c4f0223d0?pvs=1`

## Feito Nesta Sessao

- Criado sistema de colaboracao Claude Code + Codex:
  - `AI_COLLABORATION_SYSTEM.md`
  - `AI_HANDOFF.md`
  - `AI_TASK_BOARD.md`
  - `SESSION_START_PROMPT.md`

## Arquivos Alterados

- `AI_COLLABORATION_SYSTEM.md`
- `AI_HANDOFF.md`
- `AI_TASK_BOARD.md`
- `SESSION_START_PROMPT.md`

## Testes/Validacoes

- Pendente apos criacao destes arquivos:
  - `git status --short --branch`
  - commit e push dos documentos de colaboracao

## Pendencias

- Confirmar se Henrique quer tambem replicar esta estrutura no Notion.
- Opcional: criar template de issue/task por fase no GitHub.
- Opcional: criar uma pagina Notion espelhando o protocolo.

## Proximo Melhor Passo

- Commitar e publicar estes arquivos.
- Em toda proxima sessao, iniciar lendo `AI_COLLABORATION_SYSTEM.md`, `AI_HANDOFF.md` e `AI_TASK_BOARD.md`.

## Riscos

- Duas IAs editarem o mesmo arquivo sem commit intermediario.
- Uma janela antiga estar atrasada em relacao ao `origin/main`.
- Deploy depender de Vercel CLI local; se o token estiver invalido, usar GitHub push + dashboard Vercel.
