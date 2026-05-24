# CLAUDE REBUILD PROMPT — Prompt Mestre para Novos Projetos

> Use este arquivo como base de contexto quando começar um novo projeto.
> Copie o bloco de prompt relevante e preencha os campos em [COLCHETES].
> O Claude usará a estrutura do Lagos World como base sem reinventar nada.

---

## COMO USAR

1. Abra uma nova sessão do Claude
2. Copie o PROMPT MESTRE abaixo
3. Preencha todos os campos em [COLCHETES]
4. Envie e deixe o Claude trabalhar
5. Use os PROMPTS COMPLEMENTARES para partes específicas

---

## PROMPT MESTRE (envie primeiro em toda nova sessão)

```
Você vai construir um site de negócio usando a estrutura do projeto Lagos World como base.
Não reinvente a arquitetura. Reutilize os padrões provados e apenas adapte para o novo negócio.

# CONTEXTO DO PROJETO BASE (Lagos World)
Stack: Node.js + Express + Supabase + Static HTML/CSS/JS + Vercel
Frontend: HTML puro inline CSS + Vanilla JS (zero frameworks)
Backend: Express serverless functions (api/index.js)
Email: Nodemailer + Gmail SMTP + App Password
Deploy: GitHub push → Vercel auto-deploy
Database: Supabase (PostgreSQL)

Estrutura de pastas:
  api/index.js                    → Express entry point
  api/routes/[nome].js            → CRUD routes para cada vertical
  api/services/email.js           → Transporter + email senders
  api/services/emailTemplates.js  → Templates HTML de email
  public/[pagina]/index.html      → Página completa (HTML + CSS + JS)
  public/admin/index.html         → Painel administrativo
  public/images/                  → Assets estáticos
  vercel.json                     → Config Vercel (routes + cron)
  package.json                    → { express, @supabase/supabase-js, nodemailer, cors, axios }

Padrões que devem ser mantidos EXATAMENTE:
- Supabase client em api/index.js via createClient + service_role key
- req.supabase = supabase no middleware (attachment to request)
- Transporter singleton em email.js (createTransporter com pool:true)
- email_queue table para sequências automáticas
- newsletter_subscribers table (email, name, source, active)
- vercel.json com outputDirectory:'public', functions para api/index.js
- POST /api/newsletter/subscribe endpoint em api/index.js
- GET /api/cron/emails + POST /api/cron/send em api/routes/cron.js
- GET /api/health healthcheck

# NOVO NEGÓCIO
Nome da marca: [NOME DA MARCA]
Tipo: [produto físico / serviço local / curso online / consultoria]
Nicho: [ex: joias de luxo / limpeza residencial / fotografia de casamento]
Público-alvo: [ex: mulheres latinas 25–45 em Filadélfia PA]
Problema que resolve: [ex: casas sujas sem tempo para limpar]
Diferencial: [ex: resposta em 2h, satisfação garantida]
Localização: [cidade, estado, país]
Telefone WhatsApp: [+1XXXXXXXXXX]
Email admin: [admin@email.com]

# IDENTIDADE VISUAL
Cor primária: [#HEX]
Cor secundária: [#HEX]
Fundo: [#HEX — ex: #ffffff para serviço limpo, #0a0a0a para luxury]
Fonte display (hero/títulos): [ex: Cormorant Garamond / Playfair Display]
Fonte body: [ex: Montserrat / Inter]
Tom visual: [dark luxury / clean professional / warm friendly / bold modern]

# OFERTAS
Oferta principal: [nome] — [preço ou "cotação gratuita"]
Oferta secundária: [nome] — [preço ou "cotação gratuita"]
Lead magnet: [ex: 10% off na primeira compra / orçamento grátis]

# PÁGINAS NECESSÁRIAS
- [ ] Página principal (public/[nome]/index.html)
- [ ] Admin panel (public/admin/index.html)
- [ ] (opcional) Página adicional: [nome]

# EMAIL SEQUENCES NECESSÁRIAS
- [ ] Welcome email (imediato no cadastro)
- [ ] Confirmação de [pedido/agendamento] (imediato)
- [ ] Follow-up +1d
- [ ] Re-engagement +7d
- [ ] Review request +30d
- [ ] Referral +45d

# SUPABASE TABLES NECESSÁRIAS
(liste as tabelas com campos principais)
[nome]_orders: customer_name, customer_email, customer_phone, total, status
[nome]_requests: customer_name, customer_email, service_type, preferred_date, status
newsletter_subscribers: email, name, source, active (padrão — não alterar)
email_queue: customer_email, customer_name, email_type, scheduled_at, status (padrão — não alterar)

# REGRAS PARA O CLAUDE SEGUIR NESTA SESSÃO
1. NUNCA instale frameworks de frontend (React, Vue, Next.js)
2. NUNCA use bibliotecas CSS externas (Bootstrap, Tailwind) — CSS inline apenas
3. NUNCA reescreva o que já está no Lagos World se puder copiar e adaptar
4. SEMPRE faça o backend ANTES do frontend
5. SEMPRE teste o email ANTES de avançar para o próximo passo
6. SEMPRE faça uma coisa por vez — não avance sem confirmar que funcionou
7. NUNCA modifique o esquema do email_queue ou newsletter_subscribers
8. SEMPRE use service_role key no Supabase (não anon key) para writes do backend
9. SEMPRE declare variáveis de ambiente no .env e documente quais são necessárias
10. SEMPRE commite depois de cada feature funcional, não acumule mudanças

# ORDEM DE CONSTRUÇÃO (siga esta ordem exatamente)
Fase 1: Setup
  1.1 Criar estrutura de pastas
  1.2 Criar package.json e instalar dependências
  1.3 Criar .env.example com todas as variáveis
  1.4 Criar api/index.js base (health check + middleware)
  1.5 Criar vercel.json

Fase 2: Backend
  2.1 Criar tabelas SQL no Supabase
  2.2 Criar api/routes/[nome].js com CRUD básico
  2.3 Criar api/services/email.js (copiar base do Lagos World)
  2.4 Criar api/services/emailTemplates.js (adaptar cores e copy)
  2.5 Criar api/routes/cron.js (copiar e adicionar novos tipos)
  2.6 Registrar rotas em api/index.js

Fase 3: Teste de Email
  3.1 Configurar .env local
  3.2 node api/index.js para iniciar local
  3.3 curl POST /api/cron/send para testar cada template
  3.4 Verificar inbox antes de avançar

Fase 4: Frontend
  4.1 Criar estrutura HTML base (head, meta SEO, Schema.org)
  4.2 Definir :root CSS vars (paleta completa)
  4.3 Construir componentes: nav → hero → services → reviews → form → footer
  4.4 Adicionar JavaScript (formulários, popup, interações)
  4.5 Adicionar responsividade (breakpoints 1200/900/768/560/480)
  4.6 Adicionar animações de entrada (fade-up)

Fase 5: Admin Panel
  5.1 Copiar estrutura base do admin Lagos World
  5.2 Adaptar abas para o novo negócio
  5.3 Conectar às APIs criadas

Fase 6: QA e Deploy
  6.1 Testar formulário end-to-end
  6.2 Testar responsivo
  6.3 git push origin main
  6.4 Verificar deploy no Vercel
  6.5 Testar em URL de produção
```

---

## PROMPT DE IDENTIDADE VISUAL (use na Fase 4)

```
Agora vamos construir o frontend.

PALETA DE CORES (use exatamente estes valores no :root):
  --primary:   [#HEX]
  --primary-d: [#HEX mais escuro — 20%]
  --primary-l: [#HEX mais claro — 20%]
  --primary-m: [#HEX médio]
  --bg:        [#HEX fundo principal]
  --bg-soft:   [#HEX fundo suave]
  --text:      [#HEX texto principal]
  --text-mid:  [#HEX texto secundário]
  --text-muted:[#HEX texto suave]
  --border:    [#HEX bordas]

FONTES (Google Fonts):
  Display: [nome da fonte] — para hero, títulos, logo
  Body: [nome da fonte] — para parágrafos, labels, botões

TOM VISUAL: [dark luxury / clean professional / warm / bold]

ESTILO DE CARD:
  [descreva: sombra suave / borda dourada / hover lift / dark background]

ESTILO DE BOTÃO:
  [descreva: gradient fill / sólido / outline / arredondado / quadrado]

Baseie-se no padrão do Lagos Cleaning (para professional/clean) ou
Lagos Jewelry (para luxury/dark). Adapte apenas as cores e fontes.
Não reinvente os componentes.
```

---

## PROMPT DE COPYWRITING (use para cada seção)

```
Escreva o copy para a seção [NOME DA SEÇÃO] seguindo estas regras:

NEGÓCIO: [nome e nicho]
PÚBLICO: [quem vai ler]
OBJETIVO DA SEÇÃO: [o que queremos que o visitante faça ou sinta]

REGRAS DE COPY:
1. Benefit first — escreva o RESULTADO antes de descrever o produto/serviço
2. Específico vence genérico — use números e detalhes reais
3. Tom: [elegante / profissional / próximo / urgente]
4. Idioma: [português brasileiro / inglês americano]
5. Máximo [X] palavras por parágrafo
6. Inclua: eyebrow (label pequeno) + título principal + subtítulo + CTA

CONTEXTO DE MERCADO: [o que os concorrentes dizem — para você ser diferente]

DIFERENCIAL A ENFATIZAR: [o que só você oferece]

Formato de saída esperado:
  EYEBROW: [texto]
  H1/H2: [título]
  SUBTITLE: [subtítulo]
  BODY: [1–2 parágrafos]
  CTA: [texto do botão]
```

---

## PROMPT DE SEQUÊNCIA DE EMAIL (use para criar templates)

```
Crie uma sequência de [X] emails para [NEGÓCIO].

STACK: Nodemailer + Gmail SMTP
ARQUIVO DE SAÍDA: api/services/[nome]EmailTemplates.js
PADRÃO: Siga o mesmo padrão de wrap() + btn() + p() + h() de emailTemplates.js

MARCA:
  Nome: [nome]
  Cor primária: [#HEX]
  Fonte: [Georgia serif / Arial sans-serif]
  Tom: [elegante / profissional]
  Logo: <img src="https://[dominio]/images/logo.svg" alt="Logo" width="56" height="56">

SEQUÊNCIA DESEJADA:
  Email 1: [nome] — gatilho: [imediato/+Xd] — objetivo: [boas-vindas/confirmação]
  Email 2: [nome] — gatilho: [+1d] — objetivo: [follow-up]
  Email 3: [nome] — gatilho: [+7d] — objetivo: [re-engagement]
  ...

REGRAS TÉCNICAS DE EMAIL:
1. Nunca use border-radius em <td> — Outlook não suporta
2. Sempre use tabelas para layout (não divs)
3. Sempre declare width/height em <img> explicitamente
4. Use logo como <img src="URL"> — não inline SVG no HTML do email
5. Sempre inclua preview text: <span style="display:none;max-height:0">texto</span>
6. CTA como tabela com <td> colorido e <a> interno — não <button>
7. Font-family com fallback: 'Georgia, Times New Roman, serif'
8. Máximo 600px de largura (max-width:580px no container)

ADICIONE também ao switch em processDueEmails() em email.js
e ao objeto templates em cron.js POST /send.
```

---

## PROMPT DE SEO (use na Fase 4.1)

```
Configure o SEO completo para a página [URL].

NEGÓCIO: [nome] — [tipo de negócio]
SERVIÇO PRINCIPAL: [serviço ou produto]
LOCALIZAÇÃO: [cidade, estado]
KEYWORD PRINCIPAL: [ex: "house cleaning Philadelphia"]
KEYWORDS SECUNDÁRIAS: [ex: "apartment cleaning PA", "move out cleaning NJ"]

Gere:
1. <title> — 60 chars máximo, keyword + localização + marca
2. <meta name="description"> — 155 chars, benefício + CTA + localização
3. <meta name="keywords"> — 8–10 palavras-chave relevantes
4. Schema.org JSON-LD completo — tipo correto para o negócio
5. Open Graph tags (og:title, og:description, og:url, og:type)
6. <link rel="canonical">

SCHEMA TYPE: [LocalBusiness / CleaningService / JewelryStore / Course / etc.]
ENDEREÇO: [rua, cidade, estado, CEP]
TELEFONE: [+1XXXXXXXXXX]
RATING: [X.X] / REVIEWS: [XX]
HORÁRIO: [seg-sex 8–18h / sab 9–16h]
ÁREAS ATENDIDAS: [lista de cidades/estados]

Padrão de referência: use a página public/cleaning/index.html do Lagos World
como modelo de implementação.
```

---

## PROMPT DE ADMIN PANEL (use na Fase 5)

```
Adapte o painel administrativo do Lagos World para o negócio [NOME].

ABAS NECESSÁRIAS:
  1. [nome] — tabela de pedidos/agendamentos/leads
  2. Produtos (se aplicável) — grid editável com sync Supabase
  3. Templates — envio manual de emails (usando POST /api/cron/send)
  4. [adicionar aba custom se necessário]

PARA CADA ABA, inclua:
  - KPI cards no topo (total, pendentes, concluídos, receita)
  - Tabela com colunas relevantes para o negócio
  - Filtro de busca
  - Atualização de status via PATCH /api/[rota]/:id
  - Paginação client-side (50 itens/página)
  - Export CSV (botão que baixa os dados da tabela)

AUTENTICAÇÃO: password simples via prompt JS
  const PASSWORD = '[senha]';
  if (!localStorage.getItem('admin_auth')) {
    const pw = prompt('Admin password:');
    if (pw !== PASSWORD) { document.body.innerHTML = 'Unauthorized'; return; }
    localStorage.setItem('admin_auth', '1');
  }

COR DO ADMIN: [troque --gold do Lagos Jewelry pela cor primária do novo negócio]

Copie a estrutura base do public/admin/index.html do Lagos World.
Adapte apenas os dados, rotas e cores. Não reescreva o sistema de tabs,
paginação ou toast notification.
```

---

## PROMPT DE DEBUGGING (use quando algo não funcionar)

```
Preciso debugar um problema no projeto [nome].

AMBIENTE: [local / Vercel production]
STACK: Node.js + Express + Supabase + Nodemailer + Vercel

ERRO OBSERVADO: [cole o erro exato aqui]

CONTEXTO:
  - Endpoint afetado: [ex: POST /api/cleaning/requests]
  - Ação que causou o erro: [ex: submit do formulário de agendamento]
  - Quando ocorre: [sempre / às vezes / apenas em produção]

LOGS DISPONÍVEIS:
  [cole os logs do console ou Vercel aqui]

ARQUIVOS RELEVANTES:
  [liste os arquivos que podem estar causando o problema]

CHECKLIST DE DIAGNÓSTICO (verifique antes de pedir ajuda):
  [ ] .env configurado com todas as variáveis?
  [ ] Gmail App Password de 16 dígitos (não senha normal)?
  [ ] Supabase service_role key (não anon key)?
  [ ] Tabela existe no Supabase com todos os campos?
  [ ] Vercel env vars configuradas (não só .env local)?
  [ ] CORS configurado? (app.use(cors()) em api/index.js)
  [ ] req.supabase disponível? (middleware app.use((req,res,next) => { req.supabase = supabase; next(); }))
```

---

## PROMPT DE REPLICAÇÃO RÁPIDA (para quando você quer ir direto ao ponto)

```
Replique o site Lagos World para o seguinte negócio, gastando o mínimo de tokens possível:

NEGÓCIO: [nome, nicho, localização]
BASEIE-SE EM: [página de cleaning / página de jewelry / ambas]
TIPO DE CONVERSÃO: [formulário de agendamento / carrinho de compras / WhatsApp direto]

MUDANÇAS NECESSÁRIAS:
  1. Paleta de cores: [lista as CSS vars para trocar]
  2. Textos: hero eyebrow "[X]", título "[X]", subtítulo "[X]"
  3. Serviços: [lista os serviços com ícone, nome, descrição]
  4. Reviews: [lista 3 depoimentos com nome e texto]
  5. FAQ: [lista 5 perguntas e respostas]
  6. WhatsApp: [número]
  7. Email admin: [email]

NÃO RECRIE:
  - Sistema de CSS (apenas troque as CSS vars)
  - Estrutura HTML das seções (apenas troque o conteúdo)
  - FAQ accordion JavaScript
  - Newsletter popup JavaScript
  - Email queue system
  - Admin panel base

CRIE APENAS:
  - Adaptações de conteúdo nas seções existentes
  - Novos templates de email com a nova paleta
  - Novas rotas de API se houver novo tipo de conversão

Mostre o diff do que mudou, não o arquivo inteiro.
```

---

## CHECKLIST FINAL DE SESSÃO

Antes de encerrar qualquer sessão de desenvolvimento, verifique:

```
[ ] Health check funciona: curl https://[dominio]/api/health
[ ] Email de teste enviado: curl -X POST /api/cron/send {"type":"welcome","to":"teste@email.com"}
[ ] Formulário testado end-to-end (submit → email → Supabase)
[ ] Admin panel acessível e carregando dados
[ ] Responsivo testado em 375px, 768px, 1280px
[ ] Nenhuma imagem quebrando (sem 404)
[ ] git status limpo (tudo commitado)
[ ] Vercel deployment successful (sem build errors)
[ ] .env.example atualizado com todas as variáveis necessárias
[ ] README ou BUSINESS_TEMPLATE preenchido para o novo negócio
```

---

## DICAS DE USO EFICIENTE DOS TOKENS

### Economize tokens — use estes padrões
```
1. Copie o arquivo do Lagos World + peça diff, não o arquivo inteiro
2. Para CSS: "troque --gold por --teal no :root" (não reescreva)
3. Para templates de email: "use wrap() do cleaningEmailTemplates.js como base"
4. Para JavaScript: "reaproveite o FAQ accordion do cleaning page"
5. Para HTML: "siga a estrutura de section-label + section-title + section-sub"

6. Peça por componente, não a página inteira de uma vez
7. Confirme que cada fase funciona antes de pedir a próxima
8. Use o BUSINESS_TEMPLATE.md preenchido como contexto inicial
9. Forneça os textos finais prontos — não peça ao Claude para inventar
10. Para deploy: sempre git push + espere Vercel, não use tokens em deploy scripts
```

### Quanto custa cada parte (estimativa)
```
Setup inicial + backend:        ~15k tokens
Página principal (frontend):   ~25k tokens
Templates de email (5 tipos):  ~10k tokens
Admin panel:                   ~15k tokens
QA + ajustes:                  ~10k tokens
Total estimado novo projeto:   ~75k tokens
```

---

*Claude Rebuild Prompt gerado com base no projeto Lagos World (lagosworld.app).*
*Versão 1.0 — 2026-05-24*
