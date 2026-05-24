# TEMPLATE REFACTOR PLAN — Modelo de plano de implementação

> Este arquivo é gerado pelo Claude no início de cada novo projeto.
> Serve como contrato de implementação — aprovado antes de qualquer código.
> O modelo abaixo mostra a estrutura esperada. Claude preenche com dados reais.

---

## IDENTIFICAÇÃO DO PROJETO

```
Negócio:          [Nome do negócio]
Nicho:            [Nicho/categoria]
Tipo:             [produto físico / serviço local / curso / consultoria]
Baseado em:       Lagos World — lagosworld.app
Data:             [YYYY-MM-DD]
```

---

## ANÁLISE DE REAPROVEITAMENTO

### O que será copiado SEM ALTERAÇÃO
| Arquivo origem | Destino | O que copia |
|---------------|---------|-------------|
| api/index.js | api/index.js | Express base, Supabase middleware, /newsletter, /health |
| api/services/email.js | api/services/email.js | Transporter singleton, processDueEmails, email_queue logic |
| api/routes/cron.js | api/routes/cron.js | GET /emails + POST /send base structure |
| public/cleaning/index.html | public/[nome]/index.html | FAQ accordion JS, newsletter popup, WhatsApp float |
| vercel.json | vercel.json | Estrutura base, cron schedule |

### O que será adaptado (troca de dados/cores, não estrutura)
| Componente | De onde vem | O que muda |
|-----------|-------------|------------|
| NavBar | cleaning/index.html | Marca, links, cor primária |
| Hero split grid | cleaning/index.html | Textos, badge, stats |
| Service cards | cleaning/index.html | Serviços, ícones, descrições |
| How it works | cleaning/index.html | Textos dos passos |
| Review cards | cleaning/index.html | Depoimentos reais |
| Booking form | cleaning/index.html | Campos, opções de serviço |
| Email wrapper | cleaningEmailTemplates.js | Cor primária, marca, links |
| Admin panel | admin/index.html | Abas, rotas, colunas |
| :root CSS vars | cleaning/index.html | Toda a paleta de cores |

### O que será criado do zero
| Arquivo novo | Motivo |
|-------------|--------|
| api/routes/[nome].js | CRUD específico do novo negócio |
| api/services/[nome]EmailTemplates.js | Templates com nova paleta e copy |
| public/[nome]/index.html | Página principal do novo negócio |
| [outros se necessário] | [justificativa] |

---

## ARQUIVOS QUE SERÃO CRIADOS OU MODIFICADOS

```
CRIAR:
  api/routes/[nome].js
  api/services/[nome]EmailTemplates.js
  public/[nome]/index.html
  public/[nome]/ (diretório)

MODIFICAR:
  api/index.js              → adicionar require('./routes/[nome]') + app.use()
  api/routes/cron.js        → adicionar novos tipos de email ao templates map
  api/services/email.js     → adicionar send[Nome]Confirmation() function
  vercel.json               → adicionar rewrite para /[nome] → /[nome]/index.html
  public/admin/index.html   → adicionar aba do novo negócio

NÃO TOCAR:
  api/services/emailTemplates.js  (Lagos Jewelry — não alterar)
  public/jewelry/index.html       (Lagos Jewelry — não alterar)
  public/cleaning/index.html      (Lagos Cleaning — não alterar)
  Tabelas: newsletter_subscribers, email_queue (schema fixo)
```

---

## SUPABASE — TABELAS NECESSÁRIAS

```sql
-- Tabela principal do novo negócio
CREATE TABLE [nome]_[tipo] (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  -- [campos específicos do negócio]
  status        TEXT DEFAULT 'pending',
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Reutilizar sem criar:
-- newsletter_subscribers  (já existe)
-- email_queue             (já existe)
```

---

## SEQUÊNCIA DE EMAIL

| # | Template | Gatilho | Dias após evento | Objetivo |
|---|---------|---------|-----------------|---------|
| 1 | [nome]_confirmed | Submit formulário | 0 | Confirmar + criar expectativa |
| 2 | [nome]_followup | D+1 | +1 | Follow-up se não respondeu |
| 3 | [nome]_reengagement | D+7 | +7 | Reativar interesse |
| 4 | [nome]_review | D+30 | +30 | Pedir avaliação |
| 5 | [nome]_referral | D+45 | +45 | Indicação com recompensa |

**Email types para email_queue:**
```
[nome]_followup
[nome]_reengagement
[nome]_review
[nome]_referral
```

---

## IDENTIDADE VISUAL APLICADA

```css
/* Vars que serão trocadas no :root */
--primary:    [#HEX]     /* cor principal */
--primary-d:  [#HEX]     /* 20% mais escuro */
--primary-l:  [#HEX]     /* 20% mais claro */
--primary-bg: [#HEX]     /* fundo suave da cor primária */
--bg:         [#HEX]     /* fundo geral da página */
--text:       [#HEX]     /* texto principal */
--text-mid:   [#HEX]     /* texto secundário */
--text-muted: [#HEX]     /* texto suave */
--border:     [#HEX]     /* bordas */
```

**Fontes:**
```html
Display: [nome] — para hero e títulos
Body:    [nome] — para parágrafos e labels
```

**Logo:** `public/images/[nome]-logo.svg`

---

## ESTRUTURA DA PÁGINA PRINCIPAL

```
[x] Top bar (promoção / número / área de atuação)
[x] NavBar (marca + links + CTA)
[x] Hero (split grid: texto + card de prova social)
[x] Trust strip (4 badges de confiança)
[x] Services section (grid 3 colunas)
[ ] Before/After gallery (se aplicável)
[x] How it works (4 passos)
[x] Reviews + Rating summary
[ ] Elite/Premium section (se houver oferta premium)
[x] Promotions (3 cards: first-time / referral / seasonal)
[x] Service area / coverage
[x] FAQ accordion
[x] Booking form (formulário de conversão)
[x] Footer (3 colunas: serviços / empresa / contato)
[x] WhatsApp float button
[x] Newsletter popup (delay 8s)
```

---

## ROTAS DA API A CRIAR/REGISTRAR

```javascript
// api/index.js — adicionar:
const [nome]Routes = require('./routes/[nome]');
app.use('/api/[nome]', [nome]Routes);

// api/routes/[nome].js — criar:
POST   /api/[nome]/requests      → criar solicitação + email automático
GET    /api/[nome]/requests      → listar (admin)
PATCH  /api/[nome]/requests/:id  → atualizar status

// api/routes/cron.js — adicionar ao templates map:
[nome]_confirmed:    { html: nt.[nome]Confirmed(firstName),    subject: '...' }
[nome]_followup:     { html: nt.[nome]Followup(firstName),     subject: '...' }
[nome]_reengagement: { html: nt.[nome]Reengagement(firstName), subject: '...' }
[nome]_review:       { html: nt.[nome]Review(firstName),       subject: '...' }
[nome]_referral:     { html: nt.[nome]Referral(firstName),     subject: '...' }
```

---

## ORDEM DE IMPLEMENTAÇÃO

```
Fase 1 — Backend (confirme email funcionando antes de avançar)
  1.1 [ ] Criar tabela no Supabase
  1.2 [ ] Criar api/routes/[nome].js com CRUD
  1.3 [ ] Registrar rota em api/index.js
  1.4 [ ] Criar api/services/[nome]EmailTemplates.js
  1.5 [ ] Adicionar send[Nome]Confirmation() em email.js
  1.6 [ ] Adicionar tipos ao cron.js
  1.7 [ ] Testar: curl POST /api/cron/send {"type":"[nome]_confirmed","to":"teste@email.com"}
  1.8 [ ] PARAR — confirmar email antes de continuar

Fase 2 — Frontend
  2.1 [ ] Criar public/[nome]/index.html (copiar base do cleaning)
  2.2 [ ] Trocar :root CSS vars
  2.3 [ ] Trocar Google Fonts
  2.4 [ ] Adaptar NavBar
  2.5 [ ] Adaptar Hero
  2.6 [ ] Adaptar Service cards
  2.7 [ ] Adaptar How it works
  2.8 [ ] Adaptar Reviews
  2.9 [ ] Adaptar FAQ
  2.10 [ ] Adaptar Booking form (campos + POST correto)
  2.11 [ ] Adaptar Footer
  2.12 [ ] Newsletter popup (troca copy + source)
  2.13 [ ] Adicionar rewrite ao vercel.json

Fase 3 — Admin
  3.1 [ ] Adicionar aba do novo negócio ao admin/index.html
  3.2 [ ] KPI cards (total, pendentes, concluídos)
  3.3 [ ] Tabela com colunas relevantes + update de status
  3.4 [ ] Adicionar tipos de email à aba de templates

Fase 4 — QA + Deploy
  4.1 [ ] Testar formulário end-to-end
  4.2 [ ] Testar responsivo (375 / 768 / 1280px)
  4.3 [ ] Verificar SEO (title, description, schema.org)
  4.4 [ ] git push origin main
  4.5 [ ] Verificar Vercel deploy
  4.6 [ ] Testar em produção
```

---

## ESTIMATIVA DE TOKENS

| Fase | Tokens estimados |
|------|----------------|
| Backend + email templates | ~10k |
| Página principal | ~18k |
| Admin panel | ~8k |
| QA + ajustes | ~5k |
| **Total** | **~41k** |

---

## RISCOS E MITIGAÇÕES

| Risco | Mitigação |
|-------|----------|
| Email não chega | Testar com curl antes de avançar para frontend |
| Supabase 401 | Confirmar uso de service_role key (não anon) |
| Imagens 404 | Verificar paths relativos vs. absolutos |
| CSS quebrado mobile | Testar em 375px após cada seção |
| Cron não dispara | Verificar CRON_SECRET no Vercel + horário GMT |

---

## APROVAÇÃO

```
[ ] Li o plano completo
[ ] Confirmo os componentes a reutilizar
[ ] Confirmo os arquivos a criar/modificar
[ ] Confirmo que o BUSINESS_TEMPLATE.md está preenchido
[ ] Confirmo que os textos principais estão prontos
[ ] Confirmo que as imagens estão disponíveis
[ ] Aprovado — pode começar pela Fase 1
```

> **Regra:** o Claude só começa a codar após o checkbox de aprovação ser confirmado.

---

*Template gerado com base na estrutura Lagos World (lagosworld.app)*
*Preencha e compartilhe com o Claude no início de cada sessão de novo projeto.*
