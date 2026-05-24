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
- Criado Preview Deployment no projeto Vercel correto `lagosworld`:
  - `https://lagosworld-4ezii88ml-binnovationmarketings-projects.vercel.app`
  - target: `preview`
  - status: `Ready`
  - protegido por Vercel Authentication.

## Arquivos Alterados

- `AI_HANDOFF.md`
- `VERCEL_PREVIEW_WORKFLOW.md`
- `.gitignore`

## Testes/Validacoes

- `npm run build`: ok
- `npx vercel inspect lagosworld-4ezii88ml-binnovationmarketings-projects.vercel.app`: Ready / target preview
- `curl` publico no preview retornou tela de Vercel Authentication, indicando Deployment Protection ativa.

## Pendencias

- Commitar atualizacao final do workflow com a URL de preview.
- Se Henrique quiser abrir sem login, configurar bypass token ou ajustar Deployment Protection.

## Proximo Melhor Passo

- Usar o preview para revisar mudancas antes de promover.
- Para producao, usar `npx vercel promote <preview-url>` ou merge/push em `main`.

## Riscos

- Sem `.vercel/project.json` local, nao da para recuperar URL exata do preview via CLI nesta maquina.
- Vercel CLI local ainda pode exigir `npx vercel login` para logs e `vercel ls`.
- Preview protegido exige login Vercel para abrir no navegador.
