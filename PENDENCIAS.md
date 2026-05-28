# Pendências — Lagos World

> Atualizado: 2026-05-28

---

## 🔴 Alta Prioridade

### 0. Páginas Legais + Conteúdo — RISCO JURÍDICO
**Referência:** https://maidbrigade.com (usar como modelo de conteúdo)

**Páginas obrigatórias antes de escalar tráfego pago:**

- [ ] **Privacy Policy** (`/privacy-policy`) — LGPD + CCPA compliance
  - Coleção de dados (nome, email, ZIP, cookies, analytics)
  - Como usamos (email marketing, Google Calendar, Supabase)
  - Direitos do usuário (acesso, exclusão, portabilidade)
  - Referência: https://maidbrigade.com/privacy-policy/

- [ ] **Terms of Service** (`/terms-of-service`) — proteção contra processos
  - Política de cancelamento (24h de antecedência)
  - Responsabilidade por danos durante o serviço
  - Limitação de responsabilidade
  - Referência: https://maidbrigade.com/terms-of-service/

- [ ] **Leave a Review** (`/reviews`) — funil de reputação
  - Link direto para Google Business Profile review
  - Link para Yelp / Facebook se aplicável
  - Referência: https://maidbrigade.com/leave-a-review/

- [ ] **Blog** (`/blog`) — SEO de longo prazo
  - Artigos: "How to prepare for your cleaning", "Airbnb cleaning checklist"
  - Frequência: 1 post/semana mínimo para ranquear
  - Referência: https://maidbrigade.com/blog/

**Ação imediata:**
1. Contratar advogado ou usar gerador (TermsFeed / Termly ~$10/mês) para Privacy Policy + ToS
2. Criar `/public/privacy-policy/index.html` e `/public/terms-of-service/index.html`
3. Adicionar links no footer de todas as páginas

---

### 1. Chave Pix da Dayane Lago
**Responsável:** Henrique → Dayane Lago
**Ação:** Pedir a Dayane a chave Pix oficial da conta da Lagos Jewelry

- A opção Pix já está no checkout (selecionável pelo cliente)
- Atualmente usando `admin.lagosworld@gmail.com` como chave Pix (provisória)
- Confirmar com Dayane: a chave Pix é esse email? Ou CPF? Ou telefone?
- Após confirmação: atualizar em `public/jewelry/index.html` nos 2 lugares:
  - Bloco `<!-- PIX INFO -->` no checkout
  - Bloco de sucesso do pedido (`suc-pay-info`)
- Também atualizar o System Prompt da Milla em `api/services/milla.js` se Milla mencionar Pix

---

## 🟡 Média Prioridade

### 2. Migração dos 512 produtos para Supabase
**Depende de:** ter `.env` local com `SUPABASE_URL` e `SUPABASE_SERVICE_KEY`

**Passo 1 — Rodar a migration SQL no Supabase:**
- Acesse: Supabase → SQL Editor
- Cole e execute o conteúdo de `migrations/007_jewelry_products.sql`

**Passo 2 — Migrar dados (sem imagens, teste rápido ~30s):**
```bash
cd "/Users/rique_energy/Documents/Negocios/Lagos Cleaning"
node scripts/migrate-products.js --skip-images
```

**Passo 3 — Migrar imagens (demora ~15-20 min, baixa 512 imagens):**
```bash
node scripts/migrate-products.js
```

**Por que fazer isso:**
- Atualmente as imagens são hotlink direto de `img1.conectavenda.com.br` (fornecedor)
- Se eles bloquearem hotlink → 512 imagens somem do site sem aviso
- Com imagens no Supabase Storage → controle total, independência do fornecedor

**Após migração:** atualizar o frontend para buscar produtos via API Supabase
em vez do arquivo estático `public/js/products-data.js` (402 KB)

---

### 3. Migration 006 — Tabela `milla_conversations`
**Ação:** Verificar se já foi rodada no Supabase
- Arquivo: `migrations/006_milla_conversations.sql`
- A Milla funciona sem ela (trata o erro), mas conversas não são salvas corretamente
- Rodar no Supabase → SQL Editor

---

### 4. Telnyx 10DLC — SMS para a Milla
**Depende de:** upgrade da conta Telnyx
**Ação:** Ao fazer upgrade:
1. Registrar Brand no Telnyx (nome da empresa, EIN/FEIN)
2. Registrar Campaign (uso: customer care / notifications)
3. Configurar webhook SMS → `POST https://lagosworld.app/api/milla/sms`
- Endpoint já pronto em `api/routes/milla.js`

---

## 🟢 Baixa Prioridade

### 5. Supabase Migration 005 — `product_overrides` nome
**Ação:** Verificar se foi rodada:
```sql
ALTER TABLE product_overrides ADD COLUMN IF NOT EXISTS name TEXT;
```
- Arquivo: `migrations/005_product_overrides_name.sql`

---

## 🔵 Próximas tarefas (backlog)

### Lagos Cleaning — Domínio separado
Ver `LAGOS_CLEANING_ROADMAP.md` para passo a passo completo.
- [ ] Registrar `lagoscleaningpa.com` no Namecheap/Cloudflare (~$12)
- [ ] Criar perfil GMB "Lagos Cleaning Services" → business.google.com
- [ ] Landing page `/airbnb-cleaning` (prioridade máxima)
- [ ] Landing page `/move-in-move-out`
- [ ] Adicionar CORS para novo domínio em `api/index.js`

### Telnyx 10DLC + WhatsApp + Milla Autônoma
- [ ] Fazer upgrade da conta Telnyx
- [ ] Registrar Brand (nome empresa, EIN)
- [ ] Registrar Campaign (customer care)
- [ ] Configurar webhook SMS → `/api/milla/sms`
- [ ] WhatsApp Business API via Telnyx (número dedicado)
- [ ] Milla responde mensagens de clientes autonomamente
- [ ] Cron: follow-up, pedido de avaliação, contato leads diários
- [ ] Relatório semanal automático no grupo WhatsApp

### Email Template — Redesign confirmação cleaning
- [ ] Adicionar imagens de marketing (criar com IA primeiro)
  - Salvar em `public/images/marketing/`
  - Upload para Supabase Storage → usar URL pública
- [ ] Redesenhar `ct.cleaningConfirmed()` em `cleaningEmailTemplates.js`
  - Hero banner teal + logo
  - Card de detalhes do agendamento
  - "What happens next" (3 passos)
  - Botão "Add to My Calendar" para o cliente
  - WhatsApp CTA + satisfaction guarantee
- [ ] Subject line: `✔ Confirmed! Lagos Cleaning is coming to you — [data]`

### Site Bilíngue EN/PT-BR
- [ ] Fase 1: `cleaning/index.html` + `powerwashing/index.html`
- [ ] Fase 2: `jewelry/index.html`
- [ ] Fase 3: admin panel
- [ ] Fase 4: email templates
- [ ] Estratégia: `data-i18n` attributes + dicionário JS, toggle no topbar

### Admin Panel — Tarefas pendentes (2026-05-28)
- [ ] Invoice auto-send → criar endpoint `/api/cleaning/invoice` (backend faltando)
- [ ] Templates tab: integrar imagem de promoção ao envio do email (hoje só salva local)
- [ ] Agenda: botão de fechar card + trigger de invoice

### Grandes projetos (sessão separada)
- [ ] Bilingual site EN/PT-BR (100+ arquivos — projeto separado)

---

## ✅ Concluído (referência)

**2026-05-28**
- Admin: Customer tabs (Jewelry/Cleaning) substituindo Client Strategies
- Admin: Revenue (Month) no painel Lagos Cleaning (lê lj_clean_pricing)
- Admin: Low Stock threshold mudado de ≤10 para <3
- Admin: Templates expand-on-click com modal (editar subject, desc, imagem promo)
- Admin: requestProof() abre WhatsApp após enviar email
- Admin: botão Instagram (lagoscleanservices) na topbar
- Hero images migradas para Supabase Storage (88% compressão)
- INP 211ms corrigido (backdrop-filter:blur removido dos overlays)
- Emails cleaning/powerwashing corrigidos (3 bugs simultâneos)
- Admin overhaul: products tab (window.PRODUCTS_ADMIN alias), dashboard tab (ID fix)
- Milla anti-hallucination: SKU format enforced, tool-first approach
- Shipping options mergeadas em seção única

**Anterior**
- Milla v3 — Executive Partner AI (Groq Llama 3.3 70B)
- Fallback automático 70B → 8B-instant em rate limit
- Multilíngue PT/EN/ES com detecção server-side e language lock
- Widget mobile bottom sheet (iOS safe-area)
- Paginação jewelry: 20/página padrão com toggle 20|40
- Pix / TED Brasil como opção de pagamento
- Seção "Quem Somos & Garantias" na página jewelry
- CC `lagosvipcleaning@gmail.com` em todos os emails de limpeza
- Preconnect Google Fonts + fetchpriority nas primeiras imagens (LCP)
