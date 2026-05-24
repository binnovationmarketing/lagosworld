# EXECUTIVE SUMMARY — Lagos World Platform

> Documento de referência rápida. Leia antes de qualquer novo projeto.
> Versão 1.0 — 2026-05-24

---

## 1. O QUE O LAGOSWORLD.APP SE TORNOU

Lagos World começou como uma página de WhatsApp sem presença digital. Hoje é uma **plataforma multi-negócio completa** sob um único domínio e backend:

| Vertical | URL | Tipo | Status |
|---------|-----|------|--------|
| Lagos Jewelry | /jewelry | E-commerce de produto físico | ✅ Live |
| Lagos Cleaning | /cleaning | Lead gen + agendamento de serviço local | ✅ Live |
| Lagos Courses | /courses | Hub de cursos online | 🔄 Placeholder |
| Admin Panel | /admin | Gestão unificada das 3 verticais | ✅ Live |

**O que existe hoje:**
- Catálogo de joias com 100+ produtos, galeria de fotos, variantes, carrinho e checkout
- Landing page de limpeza com SEO local, before/after, reviews, formulário de agendamento
- Painel administrativo com pedidos, leads, edição de produtos e envio de emails
- Sistema de email com 19 templates automatizados (14 jewelry + 5 cleaning)
- Sequências de follow-up automáticas via fila no Supabase + cron diário
- Captura de newsletter com welcome email + notificação de admin
- Override de produtos via Supabase (admin edita → site atualiza automaticamente)

**Posicionamento**: marca pessoal com fundadora visível (Dayane Lago), propósito cristão, luxo acessível para mulheres latinas em Filadélfia, PA.

---

## 2. ARQUITETURA BASE

### Stack completa
```
Frontend:  HTML5 puro + CSS3 inline + Vanilla JavaScript
Backend:   Node.js + Express.js (serverless via Vercel)
Database:  Supabase (PostgreSQL hospedado)
Email:     Nodemailer + Gmail SMTP (App Password 16 chars)
Deploy:    Vercel — GitHub push → auto-deploy
Assets:    Estáticos em /public/images/ (servidos pelo Vercel)
```

### Estrutura de arquivos
```
api/
  index.js                      ← Express entry + Supabase client + /newsletter
  routes/jewelry.js             ← CRUD pedidos + product_overrides
  routes/cleaning.js            ← CRUD agendamentos + profissionais
  routes/cron.js                ← Processador de fila + dispatch manual
  services/email.js             ← Transporter singleton + senders
  services/emailTemplates.js    ← 14 templates HTML jewelry (dark/gold)
  services/cleaningEmailTemplates.js ← 5 templates HTML cleaning (teal/white)
public/
  jewelry/index.html            ← Página completa (HTML + CSS + JS inline)
  cleaning/index.html           ← Landing page SEO local
  courses/index.html            ← Placeholder
  admin/index.html              ← Painel unificado
  images/                       ← lw-logo.svg, dayane-*.png, etc.
vercel.json                     ← Routes, cron 09:00 ET, function config
package.json                    ← 5 dependências apenas
```

### Princípio fundamental
**Zero frameworks de frontend.** Nenhum React, Vue, Next, Tailwind. HTML puro = deploy em segundos, sem build step, performance máxima, tokens mínimos para manter.

### Fluxo de dados
```
Usuário → HTML form/cart
  → fetch POST /api/[rota]
  → Express handler
  → Supabase INSERT
  → nodemailer sendMail (non-blocking)
  → res.json({ ok: true })

Cron diário 09:00 ET:
  → GET /api/cron/emails
  → SELECT email_queue WHERE status='pending' AND scheduled_at <= now()
  → renderiza template → sendMail → UPDATE status='sent'
```

### Tabelas Supabase
```
jewelry_orders          pedidos de joias
order_items             itens de cada pedido
product_overrides       preços/fotos editadas pelo admin
cleaning_requests       agendamentos de limpeza
cleaning_professionals  cadastro de profissionais
newsletter_subscribers  emails capturados
email_queue             fila de emails agendados
```

---

## 3. PARTES REUTILIZÁVEIS EM OUTROS NEGÓCIOS

### Reutilize SEM MUDANÇA (copie direto)
| Componente | Arquivo | Tempo |
|-----------|---------|-------|
| Express base + Supabase middleware | api/index.js | 0 min |
| Email transporter singleton | api/services/email.js | 0 min |
| Email queue processor (cron) | api/services/email.js + cron.js | 0 min |
| Newsletter subscribe endpoint | api/index.js linha 46–99 | 0 min |
| Tabelas newsletter_subscribers + email_queue | SQL | 0 min |
| vercel.json base structure | vercel.json | 5 min |
| FAQ accordion (JS) | cleaning/index.html | 0 min |
| WhatsApp float button | cleaning/index.html | 5 min |
| Newsletter popup + timer | qualquer index.html | 5 min |
| Toast notification system | jewelry/index.html | 0 min |
| Admin panel tabs structure | admin/index.html | 0 min |
| Email btn() / p() / h() helpers | emailTemplates.js | 0 min |

### Reutilize COM ADAPTAÇÃO (troque cores + textos)
| Componente | O que trocar | Tempo |
|-----------|-------------|-------|
| NavBar cleaning | marca, links, cor primária | 10 min |
| Hero split grid | textos, badge, stats, cor | 20 min |
| Service cards grid | ícones, nomes, descrições | 15 min |
| How it works steps | textos dos passos | 10 min |
| Review cards | depoimentos reais | 10 min |
| Rating summary | números, stars | 5 min |
| Booking form | campos, opções de serviço | 15 min |
| Email wrapper (cleaning) | cor header, marca, links | 15 min |
| Email wrapper (jewelry) | paleta, marca, links | 15 min |
| Promotion cards (3 tipos) | textos, códigos | 10 min |
| Before/after gallery | fotos, labels | 10 min |
| Admin panel data | rotas, colunas, KPIs | 30 min |

### NÃO reutilize — reescreva para o nicho
| Componente | Por quê |
|-----------|---------|
| Cart drawer + checkout modal | Específico para e-commerce de produto físico |
| Product modal com galeria | Específico para catálogo de produto |
| ZIP detection + shipping calc | Específico para entrega física |
| Zelle/Cash payment flow | Específico para Lagos Jewelry |

---

## 4. PROCESSO IDEAL — MENOS TOKENS

### Regras de ouro para novas sessões
```
1. Preencha o BUSINESS_TEMPLATE.md ANTES de abrir uma sessão
2. Use o CLAUDE_REBUILD_PROMPT.md como primeiro mensagem da sessão
3. Copie + adapte, nunca reescreva do zero
4. Peça diff (mudanças), não o arquivo inteiro
5. Uma fase por vez — confirme que funciona antes de avançar
6. Forneça os textos finais prontos — não gaste tokens gerando copy
7. Diga "baseie-se no padrão X do Lagos World" em vez de descrever do zero
8. Teste email ANTES de avançar para o frontend
```

### Estimativa de custo por fase
```
Setup + backend:          ~10k tokens
Templates de email:       ~8k tokens
Página principal:         ~20k tokens
Admin panel:              ~10k tokens
QA + ajustes:             ~7k tokens
─────────────────────────────────────
Total projeto novo:       ~55k tokens
(vs. construir do zero:   ~150k tokens)
```

### Economia de 63% vem de:
- Não reinventar CSS (apenas troque as CSS vars)
- Não reinventar o email system (copie processDueEmails() inteiro)
- Não reinventar o admin (adapte as tabs e rotas)
- Fornecer textos prontos (não gerar copy via IA)
- Testar fase por fase (não acumular bugs)

---

## 5. SEQUÊNCIA PARA CRIAR NOVA VERSÃO

### FASE 1 — DIAGNÓSTICO DO NEGÓCIO (antes de qualquer código)

```
Perguntas obrigatórias:
  ○ Qual é o tipo de conversão? (formulário / carrinho / WhatsApp / calendário)
  ○ Qual é o ticket médio? (define se mostra preço ou "cotação")
  ○ Existe fundador/a visível? (foto disponível?)
  ○ Existem depoimentos reais? (mínimo 3 antes de lançar)
  ○ Qual é a área de atuação? (local / nacional / online)
  ○ Qual o canal de aquisição principal? (Google / WhatsApp / Instagram)

Entregável desta fase:
  → BUSINESS_TEMPLATE.md preenchido (todos os 35 campos)

Tempo: 30 minutos (preencher, não codar)
```

---

### FASE 2 — DEFINIÇÃO DA OFERTA (antes de qualquer visual)

```
Defina:
  ○ Oferta principal (nome + preço ou "cotação")
  ○ Oferta secundária / upsell
  ○ Lead magnet (desconto / orçamento grátis / conteúdo)
  ○ Sequência de email desejada (quais tipos, em quais dias)
  ○ Método de pagamento (Zelle / PIX / Stripe / link / presencial)

Decida:
  ○ Cart + checkout?      → use padrão jewelry
  ○ Formulário de lead?   → use padrão cleaning
  ○ Link externo?         → simplifica (sem backend de pedido)

Entregável:
  → Lista de produtos/serviços com preços
  → Sequência de email definida (ex: D0, D1, D7, D30, D45)
  → Método de conversão escolhido

Tempo: 20 minutos (decisão, não código)
```

---

### FASE 3 — ADAPTAÇÃO VISUAL (troque vars, não reescreva CSS)

```
Passo 1: Defina paleta de 4 vars no :root
  --primary, --primary-d, --primary-l, --bg, --text

Passo 2: Escolha 2 fontes no Google Fonts
  Display (serifada): Cormorant / Playfair / Lora / DM Serif
  Body (sans-serif):  Montserrat / Inter / Poppins / Nunito

Passo 3: Crie logo SVG (use o template em PROJECT_BLUEPRINT.md)
  Salve em public/images/logo.svg

Passo 4: Colete imagens (mínimo necessário)
  → Foto do fundador (obrigatória — converte 3x mais)
  → 3–5 fotos do produto/serviço
  → (opcional) before/after

Passo 5: Aplique as vars
  → Find & replace --gold → --primary nas CSS vars
  → Troque fontes no @import e font-family
  → Atualize URL do logo nos emails

Entregável:
  → :root vars definidas
  → Google Fonts link atualizado
  → logo.svg criado e hospedado

Tempo: 45 minutos
```

---

### FASE 4 — ADAPTAÇÃO DOS TEXTOS (copy pronto antes de abrir sessão)

```
Prepare ANTES de abrir o Claude:
  ○ Eyebrow do hero (ex: "PHILADELPHIA'S FINEST")
  ○ Título principal do hero
  ○ Subtítulo (1 linha — o que você oferece)
  ○ Tagline/versículo/missão
  ○ CTA principal ("Book My Cleaning" / "Shop Now")
  ○ 6 serviços ou produtos (nome + descrição 2 linhas + ícone emoji)
  ○ 4 passos do "how it works" (título + 1 linha)
  ○ 3–6 depoimentos reais (nome + cidade + texto + rating)
  ○ 6–8 perguntas do FAQ + respostas
  ○ Copy de cada email da sequência

Regras de copy:
  Benefit first:    "Feel beautiful every day" ANTES de "18k gold plated"
  Específico:       "4h response" NUNCA "fast response"
  Verbo no CTA:     "Book My Cleaning" NUNCA "Submit"
  Fundador:         "I started Lagos because..." NUNCA "we are a company"

Entregável:
  → Documento .txt com todos os textos finais

Tempo: 60 minutos (escrita humana, não IA)
```

---

### FASE 5 — ADAPTAÇÃO DOS COMPONENTES (sessão Claude)

```
Ordem de implementação:
  1. api/index.js        → copie base, adicione /newsletter, health check
  2. Supabase tables     → rode SQL das tabelas necessárias
  3. api/routes/[nome].js → CRUD do novo negócio
  4. api/services/email.js → copie base, adapte sendCleaningConfirmation para o nicho
  5. emailTemplates.js   → copie wrap(), adapte paleta e marca
  6. api/routes/cron.js  → copie base, adicione novos tipos de email
  7. Teste email         → PARE AQUI e confirme que o email chega
  8. public/[nome]/index.html → construa seção por seção:
       nav → hero → trust strip → services → proof → reviews → faq → form → footer
  9. Newsletter popup    → copie e troque cores/copy
  10. public/admin/index.html → copie base, adapte abas e rotas
  11. vercel.json        → atualize paths e outputDirectory

Checklist por componente antes de avançar:
  ○ Visual correto nas 3 larguras (375px / 768px / 1280px)?
  ○ JavaScript funcionando (formulário, popup, accordion)?
  ○ API respondendo corretamente?
  ○ Email enviado e recebido?

Tempo: 4–5 horas de sessão Claude
```

---

### FASE 6 — REVISÃO DE SEO (30 minutos)

```
Checklist completo:
  ○ <title> = Keyword principal + Localização + Marca (≤60 chars)
       Exemplo: "House Cleaning Philadelphia PA | Lagos Cleaning"
  ○ <meta description> = Benefício + CTA + Localização (≤155 chars)
  ○ <h1> = Uma por página, contém keyword principal
  ○ <h2> = Subseções com variações da keyword
  ○ <img alt> = Descreve imagem com keyword contextual
  ○ Schema.org JSON-LD = Tipo correto, endereço, telefone, rating, horário
  ○ <link rel="canonical"> = URL definitiva sem parâmetros
  ○ Open Graph = og:title, og:description, og:image (1200×630), og:url
  ○ robots: index, follow
  ○ Google Fonts com preconnect (performance)
  ○ Imagens abaixo do fold com loading="lazy"

Schema types por negócio:
  Limpeza:       "CleaningService"
  Joalheria:     "JewelryStore"
  Restaurante:   "Restaurant"
  Consultoria:   "ProfessionalService"
  Pet grooming:  "AnimalShelter" ou "LocalBusiness"
  Academia:      "SportsActivityLocation"
  Curso online:  "Course" (por curso) + "EducationalOrganization"

Tempo: 30 minutos
```

---

### FASE 7 — TESTE FINAL (não pule — salva horas de debugging pós-launch)

```
Testes obrigatórios:
  ○ Health check: curl https://[dominio]/api/health → { "status": "ok" }
  ○ Email welcome: POST /api/cron/send {"type":"welcome","to":"teste@email.com"}
  ○ Formulário end-to-end: preencha → submit → email chega → admin notificado
  ○ Supabase: registro aparece na tabela correta
  ○ Admin panel: carrega dados, atualiza status, envia email manual
  ○ Mobile 375px: nenhum overflow horizontal, botões clicáveis
  ○ Tablet 768px: grid correto, nav funcional
  ○ Desktop 1280px: max-width respeitado, proporcional
  ○ Newsletter popup: aparece em 8s, submit vai para Supabase
  ○ WhatsApp link: abre no número correto

Erros mais comuns nesta fase:
  → Email não chega: Gmail App Password errado (verifique se tem 16 chars sem espaço)
  → Supabase 401: usando anon key no backend (use service_role key)
  → Formulário 500: campo obrigatório ausente no INSERT (verifique schema)
  → Imagem 404: path errado (public/images/ não public/img/)
  → Vercel 404: rota não declarada em vercel.json

Tempo: 45 minutos
```

---

### FASE 8 — PUBLICAÇÃO

```
Sequência de deploy:
  1. git add . && git status (verifique o que vai ser commitado)
  2. git commit -m "feat: [nome do negócio] v1.0 launch"
  3. git push origin main
  4. Aguarde Vercel deploy (60–90s)
  5. Verifique: https://[dominio]/api/health
  6. Teste formulário em produção (não em localhost)
  7. Envie email de boas-vindas para si mesmo em produção

Pós-publicação imediata:
  ○ Configure domínio personalizado no Vercel (se aplicável)
  ○ Verifique Google Search Console (submeta sitemap se houver)
  ○ Teste WhatsApp float em mobile real
  ○ Teste newsletter popup em aba anônima

Variáveis de ambiente no Vercel (não esqueça):
  SUPABASE_URL          → Dashboard Supabase → Project URL
  SUPABASE_SERVICE_KEY  → Dashboard Supabase → API → service_role
  EMAIL_USER            → admin@[negocio].com (conta Gmail)
  EMAIL_PASS            → App Password 16 chars (myaccount.google.com/apppasswords)
  CRON_SECRET           → string aleatória (protege /api/cron/emails)

Tempo: 20 minutos
```

---

## TEMPO TOTAL ESTIMADO POR FASE

| Fase | Atividade | Tempo | Quem faz |
|------|-----------|-------|---------|
| 1 | Diagnóstico do negócio | 30 min | Você |
| 2 | Definição da oferta | 20 min | Você |
| 3 | Adaptação visual | 45 min | Você + Claude |
| 4 | Adaptação dos textos | 60 min | Você |
| 5 | Adaptação dos componentes | 4–5h | Claude |
| 6 | Revisão de SEO | 30 min | Claude |
| 7 | Teste final | 45 min | Você + Claude |
| 8 | Publicação | 20 min | Você + Claude |
| **Total** | | **~8 horas** | |

**Fases 1, 2 e 4 você faz sozinho — sem Claude.** Isso economiza ~30k tokens e garante que o resultado final representa o seu negócio, não uma versão genérica gerada por IA.

---

## DOCUMENTOS DE REFERÊNCIA

| Documento | Quando usar |
|-----------|------------|
| `PROJECT_BLUEPRINT.md` | Entender o que foi construído |
| `COMPONENT_MAP.md` | Localizar um componente específico |
| `REPLICATION_GUIDE.md` | Adaptar para um nicho específico |
| `BUSINESS_TEMPLATE.md` | Preencher antes de começar qualquer projeto |
| `CLAUDE_REBUILD_PROMPT.md` | Primeira mensagem de qualquer nova sessão |
| `EXECUTIVE_SUMMARY.md` | Revisão rápida antes de tomar decisões |

---

*Lagos World Platform — Executive Summary v1.0*
*Projeto: lagosworld.app | GitHub: binnovationmarketing/lagosworld*
