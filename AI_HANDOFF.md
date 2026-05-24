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

## Feito Nesta Sessao (2026-05-24)

- Criado `/powerwashing` landing page para CH Elite Washing (v1 + v2):
  - Commit v1: `b77fe2f` — pagina base com Motion.js, laranja + navy, logo SVG
  - Commit v2: `fe3b45a` — UI/UX Pro Max upgrade completo:
    - Split hero: texto esquerda / mosaic 2x2 direita (fotos reais Unsplash)
    - Ticker marquee de trust signals no topo
    - Todos emojis removidos → SVG inline
    - Glassmorphism trust pills no hero
    - Galeria de 5 fotos com hover overlay (driveway, house, deck, property, garage)
    - Before/After drag slider interativo (clip-path)
    - Mobile sticky bottom CTA bar (Quote + WhatsApp)
    - Motion.js scroll animations (inView + stagger)
  - `vercel.json` atualizado com rewrite `/powerwashing`
  - WhatsApp: 2407806473
  - Form endpoint: `/api/cleaning/requests` com `business: 'power_washing'`
- Sincronizado local `main` com `origin/main` (git pull ff-only)
- GitHub ruleset configurado: protect-main (restrict deletions + block force pushes)

## Arquivos Alterados

- `public/powerwashing/index.html` (criado e reescrito v2)
- `vercel.json` (adicionado rewrite /powerwashing)
- `AI_HANDOFF.md`

## Testes/Validacoes

- `git push origin main` OK — Vercel auto-deploy ativado em producao
- URL em producao: `https://lagosworld.app/powerwashing`

## Pendencias CRITICAS

- **Meta Pixel**: aguardando Pixel ID de Henrique (Facebook Business → Events Manager → Pixels)
- **Google Business Profile**: acao manual de Henrique em business.google.com
- **Cart tracking → Supabase**: localStorage atual nao funciona em producao. Requer endpoint POST + cron abandoned cart
- **Stripe para Lagos Jewelry**: carrinho existe, sem pagamento. CRITICO para receita.
- **Database reset**: Henrique decide — Opcao A (TRUNCATE data) ou Opcao B (DROP + recreate)

## Proximo Melhor Passo

- Stripe para Lagos Jewelry (maior impacto em receita)
- Ou: Meta Pixel (Henrique fornece Pixel ID)
- Ou: backend cart events para Supabase

## Riscos

- Sem `.vercel/project.json` local, nao da para recuperar URL exata do preview via CLI nesta maquina.
- Vercel CLI local ainda pode exigir `npx vercel login` para logs e `vercel ls`.
- Preview protegido exige login Vercel para abrir no navegador.
