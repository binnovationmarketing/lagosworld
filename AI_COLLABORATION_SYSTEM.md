# AI COLLABORATION SYSTEM — Claude Code + Codex

> Sistema operacional para usar Claude Code e Codex no mesmo projeto sem perder contexto, retrabalho ou commits importantes.

## Objetivo

Permitir que Henrique use duas inteligencias no mesmo projeto de forma coordenada:

- **Claude Code**: continuidade longa, escrita de documentos, implementacao guiada por fases, grandes refactors.
- **Codex**: revisao tecnica, verificacao, deploy, reconciliacao Git, debugging, testes e execucao objetiva.

O objetivo nao e fazer as duas IAs trabalharem ao mesmo tempo no mesmo arquivo sem controle. O objetivo e criar uma passagem de bastao clara.

---

## Regra Central

Antes de trocar de IA, sempre atualizar:

1. `AI_HANDOFF.md`
2. `AI_TASK_BOARD.md`
3. Git status limpo ou commit WIP claro

Se isso nao for feito, a proxima IA deve primeiro rodar o protocolo de recuperacao.

---

## Arquivos do Sistema

| Arquivo | Funcao |
|---|---|
| `AI_COLLABORATION_SYSTEM.md` | Regras permanentes de colaboracao Claude Code + Codex |
| `AI_HANDOFF.md` | Estado atual do projeto, ultima decisao, proximo passo |
| `AI_TASK_BOARD.md` | Quadro vivo de tarefas por status |
| `PROJECT_BLUEPRINT.md` | Arquitetura base do Lagos World |
| `COMPONENT_MAP.md` | Mapa de componentes reutilizaveis |
| `REPLICATION_GUIDE.md` | Processo de replicacao para novos negocios |
| `PRINCIPLES.md` | Anti-patterns e ordem correta de construcao |

---

## Papeis Recomendados

### Claude Code deve assumir quando

- A tarefa envolve gerar documentacao extensa.
- A tarefa exige adaptar um negocio inteiro por fases.
- A tarefa exige escrever muito HTML/CSS/copy.
- A tarefa exige transformar ideia em plano antes de executar.
- O trabalho precisa seguir checklist longo.

### Codex deve assumir quando

- O projeto precisa ser sincronizado com Git/GitHub.
- Existem conflitos entre worktrees, commits ou janelas.
- O deploy precisa ser validado.
- A API precisa ser testada com comandos reais.
- A tarefa envolve debugging objetivo.
- E preciso revisar risco, seguranca, build, dependencies ou producao.

### Ambos podem atuar, mas em fases separadas

Exemplo correto:

1. Claude Code cria/edita feature.
2. Claude Code atualiza `AI_HANDOFF.md`.
3. Codex revisa diff, testa build, corrige problemas.
4. Codex commita/pusha.
5. Claude Code continua a proxima fase.

Exemplo errado:

- Claude Code e Codex editando `public/jewelry/index.html` ao mesmo tempo sem commit intermediario.

---

## Fluxo Padrao de Trabalho

### 1. Inicio de qualquer sessao

A IA deve executar:

```bash
git status --short --branch
git log --oneline --decorate --max-count=8
```

Depois deve ler:

```bash
sed -n '1,220p' AI_HANDOFF.md
sed -n '1,220p' AI_TASK_BOARD.md
```

Se o projeto estiver sujo, a IA deve identificar:

- quais arquivos foram alterados;
- se parecem alteracoes da outra IA;
- se deve preservar, commitar, ou pedir confirmacao.

### 2. Antes de editar codigo

A IA deve registrar no chat:

- arquivos que pretende alterar;
- objetivo da alteracao;
- risco principal.

Para alteracoes grandes, atualizar primeiro `AI_TASK_BOARD.md`.

### 3. Durante a implementacao

Usar commits por fase funcional:

```bash
feat: add cleaning email sequence
fix: correct vercel build command
docs: add replication handoff protocol
style: improve jewelry newsletter popup
```

Nao acumular varias fases grandes em um unico commit.

### 4. Antes de trocar de IA

Atualizar `AI_HANDOFF.md` com:

- o que foi feito;
- arquivos alterados;
- comandos rodados;
- resultado dos testes;
- pendencias;
- proxima tarefa recomendada;
- riscos.

Depois, escolher uma das opcoes:

```bash
git status --short
git add .
git commit -m "tipo: resumo claro"
git push origin main
```

Ou, se ainda nao deve publicar:

```bash
git add .
git commit -m "chore: save work in progress"
```

Evitar sair com alteracoes soltas sem explicacao.

---

## Protocolo de Recuperacao

Use quando a IA nova nao sabe o que aconteceu ou quando uma janela terminou por limite de contexto.

### Passo 1 — Diagnostico

```bash
git status --short --branch
git log --oneline --decorate --max-count=12 --all
git diff --stat
```

### Passo 2 — Ler contexto vivo

```bash
sed -n '1,260p' AI_HANDOFF.md
sed -n '1,260p' AI_TASK_BOARD.md
```

### Passo 3 — Comparar com remoto

```bash
git fetch origin
git status --short --branch
git log --oneline --decorate --max-count=12 origin/main
```

### Passo 4 — Decidir acao

| Situacao | Acao |
|---|---|
| Worktree limpo e atrasado | `git pull --ff-only` |
| Worktree sujo e remoto avancou | commit local temporario, depois rebase |
| Conflito em arquivos grandes | abrir trechos conflitantes e resolver manualmente |
| Deploy falhou | Codex assume verificacao e logs |
| Feature incompleta | Claude Code assume continuidade do plano |

---

## Padrao de Handoff

Sempre terminar com este bloco no `AI_HANDOFF.md`:

```md
## Estado Atual

- Branch:
- Ultimo commit:
- Deploy:
- Worktree:

## Feito Nesta Sessao

- 

## Arquivos Alterados

- 

## Testes/Validacoes

- 

## Pendencias

- 

## Proximo Melhor Passo

- 

## Riscos

- 
```

---

## Comandos Seguros

```bash
npm install
npm run build
npm audit --audit-level=high
node -e "process.env.SUPABASE_URL='https://example.supabase.co'; process.env.SUPABASE_SERVICE_KEY='test-key'; require('./api/index.js'); console.log('api loads')"
curl -sS https://lagosworld.app/api/health
git status --short --branch
git diff --stat
git log --oneline --decorate --max-count=8
```

---

## Comandos com Cuidado

```bash
git rebase origin/main
git push origin HEAD:main
npx vercel deploy --prod
npx vercel env pull
```

Usar quando houver clareza do estado e objetivo.

---

## Comandos Proibidos Sem Pedido Explicito

```bash
git reset --hard
git checkout -- .
rm -rf
git clean -fd
```

Esses comandos podem destruir trabalho da outra IA ou do Henrique.

---

## Fluxo Ideal Para Novo Negocio

1. Henrique preenche `BUSINESS_TEMPLATE.md`.
2. Claude Code gera `TEMPLATE_REFACTOR_PLAN.md` preenchido.
3. Henrique aprova plano.
4. Claude Code implementa Fase 1 backend/email.
5. Codex testa API, email, Supabase e build.
6. Commit + push.
7. Claude Code implementa frontend.
8. Codex revisa responsividade, rotas, deploy e producao.
9. Commit + push.
10. Claude Code documenta replicacao.
11. Codex valida estado final e publica.

---

## Criterio de Qualidade

Uma tarefa so esta pronta quando:

- codigo foi implementado;
- testes ou validacoes relevantes foram rodados;
- `AI_HANDOFF.md` foi atualizado;
- `AI_TASK_BOARD.md` reflete o estado real;
- Git esta limpo ou existe commit WIP intencional;
- proxima IA consegue continuar em menos de 5 minutos.

