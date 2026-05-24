# AI TASK BOARD — Claude Code + Codex

> Quadro simples para manter as duas IAs alinhadas.

## Como Usar

- Mover tarefas entre as secoes conforme avanca.
- Cada tarefa deve ter dono recomendado: `Claude Code`, `Codex` ou `Henrique`.
- Antes de trocar de IA, atualizar este arquivo.

---

## Inbox

| Tarefa | Dono recomendado | Observacao |
|---|---|---|
| Replicar estrutura no Notion | Claude Code | Criar pagina curta com protocolo de colaboracao |
| Criar checklist de deploy final | Codex | Comandos + verificacoes de producao |

---

## Em Andamento

| Tarefa | Dono recomendado | Status |
|---|---|---|
| _Nenhuma no momento_ | - | - |

---

## Proximas Fases Recomendadas

| Fase | Dono recomendado | Criterio de pronto |
|---|---|---|
| Documentar colaboracao no Notion | Claude Code | Pagina Notion criada e linkada no Command Center |
| Validar deploy atual | Codex | Health check e build ok |
| Separar conteudo hardcoded em configs | Claude Code | `businessConfig`, `services`, `seo`, `navigation` criados |
| Revisar riscos de seguranca | Codex | Env vars, keys, cron secret e endpoints revisados |
| Criar template de novo negocio | Claude Code | Fluxo com `BUSINESS_TEMPLATE.md` funcionando |

---

## Concluido

| Tarefa | Dono | Evidencia |
|---|---|---|
| Documentacao de replicacao Lagos World | Claude Code | 9 arquivos `.md` publicados |
| Guia Notion zero-to-business | Claude Code | `https://www.notion.so/36ad8cec1ce281428ae4dc0c4f0223d0?pvs=1` |
| Reconciliar worktree atrasado com `origin/main` | Codex | Commit `b6cb750` publicado |
| Confirmar API em producao | Codex | `/api/health` retornou 200 |
| Criar `SESSION_START_PROMPT.md` | Codex | Prompt rapido para abrir qualquer nova janela |
| Estrutura Claude Code + Codex no repo | Codex | `AI_COLLABORATION_SYSTEM.md`, `AI_HANDOFF.md`, `AI_TASK_BOARD.md` criados |
| Remover foto da Dayane do hero Jewelry | Codex | Hero validada localmente sem foto |
| Corrigir contraste dos filtros Jewelry | Codex | Botao ativo preto agora usa texto branco |
| Melhorar Admin templates/status select | Codex | Preview local validado |
| Refinar barra de contato Cleaning | Codex | Preview local validado |
| Ajustes visuais Jewelry/Admin/Cleaning | Codex | Validado localmente, pendente publicacao |

---

## Bloqueios

| Bloqueio | Impacto | Resolucao |
|---|---|---|
| Vercel CLI local com token invalido | Nao permite logs/deploy via CLI | Rodar `npx vercel login` |
| Possiveis janelas antigas abertas | Pode gerar commits em base atrasada | Sempre rodar protocolo de recuperacao |

---

## Padrao de Tarefa

```md
### [Titulo]

- Dono recomendado:
- Arquivos provaveis:
- Objetivo:
- Criterio de pronto:
- Risco:
```
