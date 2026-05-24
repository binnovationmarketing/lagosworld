# VERCEL PREVIEW WORKFLOW — Teste antes de Produção

> Fluxo recomendado para Henrique trabalhar com Claude Code + Codex sem publicar mudanças direto em produção.

## Objetivo

Criar um ambiente seguro onde toda ideia, ajuste visual, nova pagina, automacao ou email seja testado em um link da Vercel antes de ir para `lagosworld.app`.

Fluxo:

```text
ideia nova
  -> branch de teste
  -> Vercel Preview URL
  -> revisao visual + funcional com Claude/Codex
  -> aprovacao do Henrique
  -> merge/push em main
  -> producao
```

---

## Regra Principal

Nunca usar `main` como area de experimentacao.

- `main` = producao
- branch `codex/binnovationmarketing/*` = teste/preview
- branch `claude/*` = trabalho em andamento do Claude Code

---

## Ambientes

| Ambiente | Origem | URL | Uso |
|---|---|---|---|
| Producao | `main` | `https://lagosworld.app` | Site real para clientes |
| Preview Vercel | qualquer branch que nao seja `main` | URL gerada pela Vercel | Teste visual, copy, checkout, emails |
| Local | maquina do Henrique | `http://127.0.0.1:PORT/...` | Desenvolvimento rapido |

## Preview Atual

Preview criado para teste:

```text
https://lagosworld-4ezii88ml-binnovationmarketings-projects.vercel.app
```

Status:

```text
Ready
Target: preview
Project: lagosworld
Created: May 24, 2026
```

Observacao importante:

- O preview esta protegido por **Vercel Authentication**.
- Isso e bom para testar ideias antes de publicar.
- Para abrir, use o navegador logado na conta Vercel/B Innovation Marketing.
- Se quiser compartilhar com alguem sem login, crie um bypass token na Vercel ou desative Deployment Protection para Preview.

---

## Fluxo Recomendado para Novas Ideias

### 1. Criar branch de teste

```bash
git checkout main
git pull --ff-only origin main
git checkout -b codex/binnovationmarketing/nome-da-ideia
```

Exemplos:

```bash
git checkout -b codex/binnovationmarketing/jewelry-hero-polish
git checkout -b codex/binnovationmarketing/cleaning-email-sequence
git checkout -b codex/binnovationmarketing/admin-dashboard-v2
```

### 2. Claude Code ou Codex implementa a ideia

Antes de editar:

```bash
git status --short --branch
```

Depois de editar:

```bash
npm run build
```

Se mexer em API:

```bash
node -e "process.env.SUPABASE_URL='https://example.supabase.co'; process.env.SUPABASE_SERVICE_KEY='test-key'; require('./api/index.js'); console.log('api loads')"
```

### 3. Commitar a fase funcional

```bash
git add .
git commit -m "style: test jewelry hero polish"
```

### 4. Subir branch de teste

```bash
git push origin codex/binnovationmarketing/nome-da-ideia
```

Se a GitHub Integration da Vercel estiver ativa, a Vercel cria automaticamente um **Preview Deployment**.

O link aparece em:

1. Vercel Dashboard -> projeto Lagos World -> Deployments
2. GitHub -> branch/commit -> checks/deployments
3. Pull Request, se um PR for criado

Se o preview estiver protegido, o visitante vera uma tela de autenticacao da Vercel. Isso nao significa que o deploy falhou; significa que a protecao esta ativa.

---

## Como Criar um Link de Teste Manualmente

Quando a Vercel CLI estiver logada:

```bash
npx vercel login
npx vercel pull --yes --environment preview
npx vercel build
npx vercel deploy --prebuilt
```

Ou, para um preview simples direto:

```bash
npx vercel deploy
```

Isso retorna uma URL parecida com:

```text
https://lagosworld-git-nome-da-branch-binnovationmarketing.vercel.app
```

Use essa URL para testar antes de producao.

---

## Como Promover para Produção

### Opcao A — GitHub merge/push para main

Use quando o teste foi aprovado e o fluxo do GitHub/Vercel esta funcionando.

```bash
git checkout main
git pull --ff-only origin main
git merge --ff-only codex/binnovationmarketing/nome-da-ideia
git push origin main
```

Vercel faz deploy de producao automaticamente.

### Opcao B — Promote pela Vercel

Use quando uma Preview URL foi validada e voce quer promover o mesmo deploy sem rebuild.

```bash
npx vercel promote <preview-url>
```

Exemplo:

```bash
npx vercel promote https://lagosworld-git-jewelry-hero-polish-binnovationmarketing.vercel.app
```

No preview atual, o comando seria:

```bash
npx vercel promote https://lagosworld-4ezii88ml-binnovationmarketings-projects.vercel.app
```

Use esse comando somente depois de aprovacao visual e funcional.

---

## Checklist de Aprovacao antes de Produção

### Visual

- [ ] Hero sem cortes ou sobreposicao
- [ ] Botoes legiveis em estado normal, hover e ativo
- [ ] Mobile 375px validado
- [ ] Desktop 1280px+ validado
- [ ] Imagens carregando corretamente
- [ ] Sem texto quebrado ou escondido

### Funcional

- [ ] Formulario envia corretamente
- [ ] Checkout abre e fecha
- [ ] Carrinho atualiza quantidade e total
- [ ] Admin panel carrega dados
- [ ] Status update funciona
- [ ] Newsletter funciona

### Backend

- [ ] `npm run build` ok
- [ ] API carrega sem erro
- [ ] `/api/health` ok
- [ ] Supabase recebe dados
- [ ] Email de teste chega
- [ ] Cron protegido por `CRON_SECRET`

### Git / Deploy

- [ ] Branch de teste criado
- [ ] Commit claro
- [ ] Preview URL testada
- [ ] `AI_HANDOFF.md` atualizado
- [ ] `AI_TASK_BOARD.md` atualizado
- [ ] Henrique aprovou
- [ ] Push/merge para `main`

---

## Papel de Cada IA nesse Fluxo

### Claude Code

Melhor para:

- criar a ideia;
- escrever copy;
- adaptar paginas;
- gerar documentacao;
- refatorar por fases.

Entrega esperada:

- branch com feature implementada;
- `AI_HANDOFF.md` atualizado;
- checklist parcial preenchido.

### Codex

Melhor para:

- revisar diff;
- rodar build/testes;
- validar preview;
- resolver Git/rebase/conflitos;
- preparar deploy;
- checar producao.

Entrega esperada:

- validacao tecnica;
- commit/push limpo;
- recomendacao: aprovar, ajustar ou bloquear.

---

## Prompt para Usar com Claude Code

```md
Use o fluxo de preview da Vercel.

Nao publique direto em main.
Crie/continue um branch de teste.
Implemente a ideia.
Atualize AI_HANDOFF.md e AI_TASK_BOARD.md.
Explique quais arquivos mudaram.
Deixe pronto para o Codex validar e subir o Preview Deployment.
```

---

## Prompt para Usar com Codex

```md
Valide esta branch como ambiente de teste.

Rode:
- git status --short --branch
- npm run build
- API load check, se aplicavel

Depois:
- publique a branch para gerar Preview Deployment na Vercel;
- informe onde encontrar o link;
- nao promova para producao sem minha aprovacao.
```

---

## Recomendacao para Henrique

Use este padrao:

1. Ideia nasce com Claude Code.
2. Codex valida e sobe preview.
3. Henrique testa no link da Vercel.
4. Claude Code ajusta copy/design se precisar.
5. Codex faz verificacao final.
6. So entao vai para `main`.

Isso reduz risco, melhora qualidade e evita que producao vire laboratorio.
