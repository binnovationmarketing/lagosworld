# PROJECT BLUEPRINT — Lagos World (lagosworld.app)

> Documento de referência técnica, visual e comercial do projeto Lagos World.
> Gerado em: 2026-05-24. Versão: 1.0.

---

## 1. VISÃO GERAL DO PROJETO

### Objetivo
Plataforma digital multi-negócio que agrupa três marcas sob um único domínio e backend:
- **Lagos Jewelry** — venda direta de joias 18k banhadas a ouro
- **Lagos Cleaning** — agendamento de serviços de limpeza residencial/comercial
- **Lagos Courses** — hub de cursos online (em construção)

### Problema que resolve
Pequeno negócio físico/WhatsApp com zero presença digital. Sem catálogo online, sem formulário de agendamento, sem captura de leads, sem sistema de email automático, sem painel administrativo.

### Para quem foi criado
- **Lagos Jewelry**: mulheres 25–55, Filadélfia/PA, que compram acessórios via WhatsApp ou Instagram. Público com interesse em joias acessíveis mas com visual de luxo.
- **Lagos Cleaning**: proprietários de residências e apartamentos em PA e NJ que buscam limpeza profissional confiável.
- **Lagos Courses**: empreendedoras que querem aprender com Dayane Lago.

### Posicionamento de marca
Lagos World não é uma loja genérica. É uma marca pessoal com fundadora visível (Dayane Lago), propósito cristão ("She is clothed with strength and dignity" — Proverbios 31:25), e posicionamento de luxo acessível.

Cada vertical tem identidade visual própria mas compartilha o mesmo propósito: **elevar a vida da mulher**.

### Promessa principal
> "Beleza, confiança e propósito — para mulheres que sabem o que querem."

### Jornada do usuário (Jewelry)
1. Encontra o site via WhatsApp link, Instagram bio ou boca a boca
2. Entra na hero page — impacto visual imediato com animações douradas
3. Navega o catálogo filtrado por categoria
4. Abre modal do produto — vê galeria de fotos, variantes, preço
5. Adiciona ao carrinho → abre checkout lateral
6. Preenche dados → escolhe Zelle ou Dinheiro → envia pedido
7. Recebe email de confirmação (automático)
8. Recebe sequência de 4 emails pós-compra (3d, 7d, 10d, 21d)

### Jornada do usuário (Cleaning)
1. Google search ("house cleaning Philadelphia") → SEO local landing page
2. Vê hero com rating 4.9★, garantia, área atendida
3. Scroll — vê serviços, before/after, como funciona, depoimentos
4. Preenche formulário de agendamento
5. Recebe email de confirmação VIP (teal) imediatamente
6. Admin recebe notificação + link Google Calendar
7. Sequência de 4 follow-ups automáticos (1d, 7d, 30d, 45d)

---

## 2. ARQUITETURA TÉCNICA

### Stack
| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML5 puro + CSS3 inline + Vanilla JavaScript |
| Backend | Node.js 18+ + Express.js |
| Database | Supabase (PostgreSQL hosted) |
| Email | Nodemailer + Gmail SMTP (App Password) |
| Deployment | Vercel (Serverless Functions) |
| Version control | GitHub (push → auto-deploy) |
| Fontes | Google Fonts (CDN) |
| Dependências | @supabase/supabase-js, express, cors, nodemailer, axios, dotenv |

**Zero frameworks de frontend.** Nenhum React, Vue, Next. HTML puro = deploy instantâneo, sem build step, performance máxima.

### Estrutura de pastas
```
lagosworld/
├── api/
│   ├── index.js                    # Express app entry point (Vercel serverless)
│   ├── routes/
│   │   ├── jewelry.js              # CRUD orders + product_overrides
│   │   ├── cleaning.js             # CRUD requests + professionals
│   │   ├── courses.js              # CRUD courses
│   │   └── cron.js                 # Email queue processor + manual dispatch
│   └── services/
│       ├── email.js                # Transporter, sendOrderEmails, sendCleaningConfirmation
│       ├── emailTemplates.js       # 14 jewelry email templates (HTML)
│       └── cleaningEmailTemplates.js # 5 cleaning email templates (HTML)
├── public/
│   ├── jewelry/
│   │   └── index.html              # Página completa do catálogo de joias
│   ├── cleaning/
│   │   └── index.html              # Landing page de limpeza (SEO local)
│   ├── courses/
│   │   └── index.html              # Hub de cursos (placeholder)
│   ├── admin/
│   │   └── index.html              # Painel administrativo unificado
│   └── images/
│       ├── lw-logo.svg             # Logo LW (usado em emails)
│       ├── dayane-1.png            # Foto fundadora (hero jewelry)
│       ├── dayane-2.png            # Foto fundadora (email brand story)
│       └── dayane-3..11.*          # Outras fotos de produto/antes-depois
├── vercel.json                     # Config Vercel: routes, cron, functions
├── package.json
└── .env                            # Variáveis locais (não vai ao git)
```

### Variáveis de ambiente obrigatórias
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
EMAIL_USER=admin.lagosworld@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx   # Gmail App Password (16 chars, 2FA required)
CRON_SECRET=seu-secret-aqui       # Protege endpoint /api/cron/emails
```

### Rotas da API
```
GET  /api/health                    # Health check
POST /api/newsletter/subscribe      # Captura email + envia welcome
POST /api/send-order                # Pedido completo (legacy)
POST /api/jewelry/orders            # Criar pedido jewelry
GET  /api/jewelry/orders            # Listar pedidos
PATCH /api/jewelry/orders/:id       # Atualizar status
GET  /api/jewelry/overrides         # Ler overrides de produto (Supabase)
PUT  /api/jewelry/overrides/:id     # Salvar override de produto
POST /api/cleaning/requests         # Criar solicitação de limpeza
GET  /api/cleaning/requests         # Listar solicitações (admin)
PATCH /api/cleaning/requests/:id    # Atualizar status
GET  /api/cron/emails               # Processar fila de emails (cron diário)
POST /api/cron/send                 # Enviar template manual
```

### Tabelas Supabase
```sql
-- Joias
jewelry_orders (id, customer_name, customer_email, customer_phone,
                delivery_method, address, city, state, zip,
                payment_method, subtotal, shipping_cost, total,
                status, notes, created_at)

order_items (id, order_id, product_name, variant_desc,
             quantity, unit_price, line_total [GENERATED], created_at)

product_overrides (id, product_id, price_overrides JSONB,
                   description, images JSONB, video_url,
                   sort_order, updated_at)

-- Limpeza
cleaning_requests (id, customer_name, customer_email, customer_phone,
                   service_type, employment_type, address, city,
                   recurrence, description, preferred_date,
                   estimated_hours, status, created_at)

cleaning_professionals (id, name, email, phone,
                        specialties JSONB, hourly_rate,
                        status, created_at)

-- Compartilhado
newsletter_subscribers (id, email, name, source, active,
                        subscribed_at, created_at)

email_queue (id, order_id, customer_email, customer_name,
             email_type, scheduled_at, status, sent_at, created_at)
```

### Lógica do painel admin
- Acessado via URL `/admin` (senha simples via prompt JS)
- Carrega dados via fetch para `/api/jewelry/orders`, `/api/cleaning/requests`
- `initApp()` async: primeiro carrega localStorage (cache rápido), depois sincroniza com Supabase
- `saveProduct()`: salva localmente E faz PUT para Supabase (overrides persistidos)
- Paginação client-side: 50 produtos/página (jewelry), scroll infinito (limpeza)
- Heat bar de produtos: conta aparições em pedidos → classifica HOT/WARM/COLD

### Deploy
```
git push origin main → GitHub → Vercel auto-deploy
```
Vercel detecta `vercel.json` → monta rota `/api/*` → `api/index.js` → serve `public/` como static files.

---

## 3. ARQUITETURA VISUAL

### Sistema de cores

**Lagos Jewelry (dark luxury)**
```css
--gold:    #c9a84c   /* ouro principal */
--gold-l:  #d4a84c   /* ouro claro */
--gold-d:  #b8922e   /* ouro escuro */
--black:   #0a0a0a   /* fundo preto */
--dark:    #f7f5f2   /* fundo claro (cards) */
--dim:     #7a7268   /* texto suave */
```

**Lagos Cleaning (profissional confiável)**
```css
--teal:    #0891B2   /* azul-teal principal */
--teal-d:  #0E7490   /* teal escuro */
--teal-l:  #CFFAFE   /* teal claro */
--green:   #16A34A   /* garantia/check */
--amber:   #F59E0B   /* destaque/urgência */
--text:    #111827   /* texto escuro */
```

**Lagos Cleaning Emails (VIP teal)**
```css
background: #eaf6f5
header:     linear-gradient(135deg, #0d2c2b, #124f4d)
accent:     #1a9e97
text:       #2d4a49
```

### Tipografia

**Jewelry page**
- Display/hero: `Cormorant Garamond` (serif, 700) — peso e elegância
- Body: `Montserrat` (sans, 300–700) — legibilidade moderna
- Italic accent: `Playfair Display` (serif, 700 italic) — suavidade
- Letter-spacing: agressivo (.2em–.7em em uppercase labels)

**Cleaning page**
- Body: `Inter` (sans, 300–800) — clareza profissional
- Headings: `Playfair Display` (serif, 700) — sofisticação controlada

### Padrão de cards

**Jewelry card**
- Background: `#f7f5f2` (cream claro)
- Border: `1px solid rgba(201,168,76,.07)` (ouro quase invisível)
- Hover: `translateY(-6px)` + border gold + box-shadow profundo
- Image: `aspect-ratio:1`, hover swap para segunda imagem
- Shimmer effect no hover: pseudo-element skewed translucendo

**Cleaning service card**
- Background: `#fff` com border `#E5E7EB`
- Hover: `translateY(-3px)` + border teal + teal top border animation
- Featured card: borda teal visível + background teal-bg

### Padrão de botões

**Jewelry CTA button**
```css
/* Gold gradient pill */
background: linear-gradient(135deg, #b8922e, #c9a84c, #d4a84c);
color: #0d0d0d;
letter-spacing: .4em;
text-transform: uppercase;
font-size: .65rem;
/* Shimmer on hover */
```

**Cleaning CTA button**
```css
/* Teal fill */
background: #0891B2;
color: #fff;
border-radius: 4px;
font-size: .78rem;
font-weight: 600;
/* Slight lift on hover */
```

### Padrão de seções

**Jewelry catalog section header**
```
✝ ou ✦ (ornamento animado)
EYEBROW TEXT (small caps, gold, .6rem, letter-spacing .6em)
TÍTULO (Cormorant Garamond, 3–4rem, gold gradient clip)
Subtítulo italic (Playfair Display, teal-gold)
Ornamento: ─── ✦ ───
Versículo bíblico (dim, italic, .72rem)
```

**Cleaning section header**
```
Label pill (teal-bg, teal-d, uppercase, .7rem)
Título (Playfair Display, 2–2.5rem, com span teal)
Subtítulo (Inter, .9rem, text-muted, max-width 580px)
```

### Padrão de espaçamento
- Seções: `padding: 4rem 2rem` (desktop), `3rem 1.5rem` (tablet), `2.5rem 1.2rem` (mobile)
- Grid gap: `1.5rem`
- Content max-width: `1440px` (jewelry), `1200px` (cleaning)

### Responsividade (breakpoints)
```css
@media(max-width:1200px) { grid: 3 cols }
@media(max-width:900px)  { grid: 2 cols, nav links hidden }
@media(max-width:768px)  { sections reduced padding }
@media(max-width:560px)  { grid: 1 col }
@media(max-width:480px)  { base text adjustments }
```

### Animações (Jewelry)
```css
@keyframes fade-up         /* entrada de elementos */
@keyframes gradient-x      /* ouro pulsante no texto */
@keyframes float           /* ornamento flutuando */
@keyframes shimmer         /* luz cruzando cards/botões */
@keyframes glow            /* halo de luz no hero */
@keyframes bounce-y        /* seta scroll */
@keyframes particle        /* partículas de poeira dourada */
@keyframes cross-glow      /* símbolo ✝/✦ brilhando */
```

### Elementos premium
- Partículas douradas no hero (JS, 15–20 partículas flutuantes)
- Grid de linhas finas douradas no fundo (CSS background-image)
- Gradiente radial no hero (profundidade)
- Shimmer effect nos cards (pseudo-element skewed)
- Founder photo com mask gradient (fade direita)
- Logo SVG baked como `lw-logo.svg` (servido como asset estático)
- Newsletter popup com timer (8s delay)

### Como o site transmite confiança
1. Fundadora visível (foto real, nome real, título)
2. Versículo bíblico (comunidade, propósito)
3. Schema.org LocalBusiness na cleaning page (stars no Google)
4. Rating 4.9★ no hero com review count
5. Badges de garantia ("Bonded & Insured", "Same-day Response")
6. Before/after reais nas fotos de limpeza
7. Depoimentos com nome, bairro e data
8. FAQ que responde objeções diretamente

---

## 4. ARQUITETURA COMERCIAL

### Ofertas presentes no site

| Produto/Serviço | Tipo | Preço | Conversão |
|----------------|------|-------|-----------|
| Joias 18k banhadas | Produto físico | $18–$85 | Carrinho → Checkout modal |
| House Cleaning | Serviço recorrente | Quote | Formulário → WhatsApp |
| Apartment Cleaning | Serviço único/recorrente | Quote | Formulário → WhatsApp |
| Move In/Out | Serviço único | Quote | Formulário |
| Office Cleaning | Serviço B2B | Quote | Formulário |
| Pressure Washing | Serviço sazonal | Quote | Formulário |
| Newsletter | Captura gratuita | Free | Popup → email sequence |

### Como cada oferta é apresentada

**Joias**: Visual antes de texto. Foto do produto em destaque → hover troca para segunda foto → click abre modal completo com galeria, descrição, variante (tamanho/cor) e preço → botão "Add to Cart" → checkout lateral → Zelle ou Dinheiro.

**Limpeza**: Problema→Solução→Prova→Ação. Hero explica o problema ("your home deserves...") → seção de serviços com ícone/título/descrição → before/after prova → como funciona (4 passos) → reviews → formulário de agendamento.

### CTAs utilizados
- Jewelry hero: "EXPLORE THE COLLECTION" (inline button)
- Catalog: "QUICK ADD" (aparece no hover do card)
- Product modal: "ADD TO CART"
- Cart sidebar: "CHECKOUT"
- Checkout: "CONFIRM ORDER"
- Cleaning hero: "Get Free Quote" + "Call Now"
- Cleaning booking: "Book My Cleaning"
- Cleaning WhatsApp float: "💬 WhatsApp"
- Newsletter popup: "Join the World" (jewelry), "Get 15% Off" (cleaning)
- Emails jewelry: "Shop Lagos Jewelry", "Complete My Order", "Leave a Review"
- Emails cleaning: "Book My Cleaning", "Message Us on WhatsApp"

### Como o site gera conversão
1. **Urgência visual**: limited badges (NEW, HOT), "quantities are limited"
2. **Free shipping hook**: "Free shipping on orders over $50" — barra de progresso no cart
3. **Welcome discount**: WELCOME10 nos emails de boas-vindas
4. **Recovery**: 3 emails de abandoned cart (1d, 3d, final com desconto LAGOS10)
5. **WhatsApp float**: botão sempre visível — menor fricção para contato
6. **Newsletter popup**: captura email antes da saída — inicia sequência automática
7. **Founder story**: humaniza a marca, cria conexão emocional
8. **Post-purchase sequence**: 4 emails automatizados para retenção e upsell

### Como a confiança é construída
```
Camada 1: Visual → marca profissional = empresa séria
Camada 2: Fundadora real → pessoa por trás = confiança pessoal
Camada 3: Reviews reais → outros compraram = prova social
Camada 4: Garantia explícita → "we make it right" = risco zero
Camada 5: WhatsApp direto → humano disponível = segurança
```

### Gatilhos de venda aplicados
- **Escassez**: badges "HOT", "limited quantities"
- **Prova social**: reviews com nome e data, rating 4.9★
- **Autoridade**: fundadora visível, "14 anos de experiência"
- **Reciprocidade**: desconto de boas-vindas antes da primeira compra
- **Urgência**: "Today only" no email abandoned cart 3
- **Afinidade**: propósito cristão, comunidade de mulheres
- **Compromisso**: confirmação de email + sequência automatizada

### Seções que geram desejo (Jewelry)
1. Hero com partículas douradas — sonho/aspiração
2. Seção de categorias com fotos profissionais — "o que eu quero"
3. Card com hover de segunda foto — intimidade com o produto
4. Modal de produto com zoom — "já é meu"
5. Email "Brand Story" — por que eu devo querer isso

### Seções que reduzem objeções (Cleaning)
1. "Bonded & Insured" badge — "não é arriscado"
2. Before/after reais — "funciona de verdade"
3. Rating 4.9★ + 87 reviews — "outros já confiaram"
4. FAQ — responde dúvidas comuns antes de perguntar
5. "2-hour response" — "não vou ficar esperando"
6. Satisfaction guarantee — "não tenho nada a perder"

---

## 5. JORNADA DE CONVERSÃO

### Jewelry — Funil completo
```
TOPO (Atenção)
└── Hero: LAGOS em ouro gigante + partículas + CTA "EXPLORE"

MEIO (Interesse + Desejo)
├── Catálogo filtrado — browse livre
├── Card hover — segunda foto revela o produto
├── Product modal — galeria completa, descrição, preço, variante
└── "Add to Cart" — intenção confirmada

FUNDO (Ação)
├── Cart sidebar — resumo + free shipping progress
├── "CHECKOUT" — modal de pagamento
├── Dados → Zelle ou Cash → Confirm
└── Email de confirmação automático

PÓS-VENDA (Retenção + Upsell)
├── +3d: "How to keep your jewelry beautiful"
├── +7d: "Complete your look" (cross-sell)
├── +10d: "How did you feel wearing it?" (review)
└── +21d: "Share with a woman you love" (referral)
```

### Cleaning — Funil completo
```
TOPO (Captação)
└── Google Search → SEO page → Hero com rating + garantia

MEIO (Qualificação)
├── Serviços → "qual é o meu caso?"
├── Before/After → "funciona?"
├── How it works → "é fácil?"
├── Reviews → "posso confiar?"
└── FAQ → "e se...?"

FUNDO (Conversão)
├── Formulário de agendamento (nome, email, serviço, data, endereço)
└── Email de confirmação imediato

PÓS-CONVERSÃO (Nurture)
├── +1d: "Did you get our message?" (follow-up)
├── +7d: "Your home is waiting" (re-engagement)
├── +30d: "How was your experience?" (review)
└── +45d: "Know someone who needs a clean home?" (referral)
```

---

## 6. SISTEMA DE EMAIL

### Sequência Jewelry (14 templates)
| Template | Gatilho | Dias |
|---------|---------|------|
| welcome | Newsletter subscribe | 0 |
| firstPurchaseOffer | Welcome +3d | +3 |
| brandStory | Welcome +7d | +7 |
| abandonedCart1 | Cart abandon | +1 |
| abandonedCart2 | Cart abandon | +3 |
| abandonedCart3 | Cart abandon (desconto) | +5 |
| browseAbandonment | Browse | +1 |
| orderConfirmation | Compra | 0 |
| jewelryCare | Pós-compra | +3 |
| crossSell | Pós-compra | +7 |
| reviewRequest | Pós-compra | +10 |
| referral | Pós-compra | +21 |
| giftCampaign | Sazonal | manual |
| vipInvitation | 2+ compras | manual |

### Sequência Cleaning (5 templates)
| Template | Gatilho | Dias |
|---------|---------|------|
| cleaningConfirmed | Formulário submit | 0 |
| cleaningFollowup24h | Após confirmação | +1 |
| cleaningReengagement | Sem resposta | +7 |
| cleaningReview | Após serviço | +30 |
| cleaningReferral | Cliente satisfeito | +45 |

### Design dos emails
- **Jewelry**: dark (#0d0d0d), gold (#c9a84c), Georgia serif, watermark LW, logo SVG
- **Cleaning**: white (#fff), teal (#1a9e97), Arial sans-serif, header dark teal

### Como funciona o cron
```
Vercel Cron: GET /api/cron/emails (todo dia 09:00 ET)
→ busca email_queue WHERE status='pending' AND scheduled_at <= now()
→ para cada linha, renderiza template HTML correspondente
→ envia via Gmail SMTP
→ atualiza status para 'sent' ou 'failed'
```

---

## 7. PAINEL ADMINISTRATIVO

**URL**: `/admin`  
**Autenticação**: password simples via prompt JS (não ideal para produção)

### Funcionalidades
- **Aba Pedidos Jewelry**: tabela de todos os pedidos + heat bar de produtos mais vendidos
- **Aba Limpeza**: KPI cards (total, pendentes, concluídos) + tabela com link Google Calendar
- **Aba Produtos**: grid de produtos com campos editáveis de preço + sync Supabase
- **Aba Cursos**: placeholder
- **Aba Templates**: envio manual de qualquer email para qualquer endereço
- **Paginação**: 50 produtos/página, controles de navegação gold

### Fluxo de override de produto
```
Admin edita preço no painel
→ saveProduct() 
→ PUT /api/jewelry/overrides/:id (Supabase)
→ localStorage update (cache)
→ Jewelry page load: fetch /api/jewelry/overrides → patch DOM
```

---

*Blueprint gerado automaticamente com base na análise do código-fonte do projeto Lagos World.*
