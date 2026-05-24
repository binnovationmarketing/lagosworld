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

- Criado fluxo de Preview/Staging na Vercel:
  - `VERCEL_PREVIEW_WORKFLOW.md`
  - define `main` como producao e branches `codex/binnovationmarketing/*` como ambiente de teste;
  - documenta como gerar Preview URL, testar e promover para producao.

## Arquivos Alterados

- `AI_HANDOFF.md`
- `VERCEL_PREVIEW_WORKFLOW.md`

## Testes/Validacoes

- Pendente nesta sessao:
  - commit do workflow de preview;
  - push de um branch de teste para acionar Preview Deployment da Vercel.

## Pendencias

- Criar e publicar branch de teste `codex/binnovationmarketing/preview-lab`.
- Verificar no dashboard da Vercel se Preview Deployment foi criado.

## Proximo Melhor Passo

- Commitar `VERCEL_PREVIEW_WORKFLOW.md`.
- Fazer push para `main` para registrar o processo.
- Fazer push de branch preview para testar o fluxo.

## Riscos

- Sem `.vercel/project.json` local, nao da para recuperar URL exata do preview via CLI nesta maquina.
- Vercel CLI local ainda pode exigir `npx vercel login` para logs e `vercel ls`.
