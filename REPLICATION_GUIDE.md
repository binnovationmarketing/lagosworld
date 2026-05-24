# REPLICATION GUIDE — Como replicar Lagos World para outro negócio

> Guia prático para criar um novo site usando a estrutura Lagos World como base.
> Pressupõe que você já leu o PROJECT_BLUEPRINT.md.

---

## 1. O QUE DEVE SER MANTIDO IGUAL (não reinvente)

### Arquitetura técnica — NÃO MUDE
- Node.js + Express + Supabase + Vercel — stack comprovada, zero custo inicial
- Static HTML frontend — sem build, sem React, deploy em segundos
- Nodemailer + Gmail SMTP — funciona imediatamente com App Password
- `vercel.json` como base — apenas troque os paths se necessário
- GitHub → Vercel auto-deploy — nunca configure CI manualmente

### Padrões de código — REAPROVEITE
- `api/index.js` estrutura base (supabase client, middleware, health check)
- `api/services/email.js` — transporter singleton, processDueEmails logic
- `email_queue` table + cron processor — funciona para qualquer negócio
- `newsletter_subscribers` table — universal
- Admin panel base (tabs, paginação, toast system)

### Componentes visuais — REAPROVEITE (troque cores/fontes)
- Sticky nav pattern
- Hero split grid (texto + card/imagem)
- Service cards (ícone + título + descrição + tag)
- How-it-works steps (numerados, linha horizontal)
- Review cards (stars + texto + autor)
- FAQ accordion
- Booking form com submit + email automático
- Footer 3-colunas
- Newsletter popup (troque cores e copy)

---

## 2. O QUE DEVE SER ALTERADO PARA CADA NICHO

### Troque OBRIGATORIAMENTE
| Item | Onde | Como |
|------|------|------|
| Nome da marca | Todo HTML, emails, vercel.json | Find & replace |
| Paleta de cores | `:root` CSS vars no topo de cada HTML | Veja seção 3 |
| Fontes | `<link>` Google Fonts + `font-family` CSS | Veja seção 3 |
| Logo | `public/images/logo.svg` | Veja seção 3 |
| Textos | Todo copy de hero, seções, emails | Veja seção 4 |
| Imagens | `public/images/` | Veja seção 5 |
| Ofertas | Seção de serviços/produtos, preços | Veja seção 6 |
| CTAs | Botões, formulários | Veja seção 7 |
| Schema.org | `<script type="application/ld+json">` | Tipo de negócio, endereço |
| Meta SEO | `<title>`, `<meta description>`, keywords | Nicho + localização |
| WhatsApp número | Todos os links `wa.me/` | Número real do negócio |
| Email admin | `ADMINS` array em email.js | Email real do dono |
| Supabase | `.env` SUPABASE_URL + KEY | Nova instância |
| Gmail | `.env` EMAIL_USER + EMAIL_PASS | Gmail + App Password |

---

## 3. COMO TROCAR IDENTIDADE VISUAL

### Passo 1: Definir paleta de cores
Escolha UMA cor primária. O sistema usa 4 variações dela:
```css
:root {
  --primary:   #HEX   /* cor principal */
  --primary-d: #HEX   /* 20% mais escuro */
  --primary-l: #HEX   /* 20% mais claro */
  --primary-m: #HEX   /* médio */
  /* Fundo e texto conforme nicho — veja exemplos abaixo */
}
```

**Receita por nicho:**
```
Joias/Luxo:      ouro #c9a84c + fundo preto #0a0a0a
Limpeza/Saúde:   teal #0891B2 + fundo branco #ffffff
Power Washing:   azul navy #1E3A5F + laranja #F59E0B
Cursos online:   roxo #7C3AED + fundo cinza claro #F9FAFB
Consultoria:     verde escuro #065F46 + creme #FFFBF0
Moda feminina:   rosa #EC4899 + bege #FDF2F8
Fotografia:      preto #111111 + prata #C0C0C0
Padaria/Food:    marrom #92400E + amarelo #FEF3C7
```

### Passo 2: Trocar fontes
```html
<!-- Hero/Display (serifada para luxo ou autoridade) -->
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@700&display=swap">
<!-- Alternativas: Playfair Display, Libre Baskerville, Lora, DM Serif -->

<!-- Body (legibilidade) -->
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&display=swap">
<!-- Alternativas: Inter, Nunito, Poppins, Lato -->
```

### Passo 3: Criar logo SVG
Modelo mínimo funcional (edite width, color, text):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#0d0d0d" rx="2"/>
  <text x="50" y="65" font-family="Georgia,serif" font-size="48"
        font-weight="bold" text-anchor="middle" fill="#c9a84c">XY</text>
</svg>
```
Salve em `public/images/logo.svg`. Use `https://seudominio.com/images/logo.svg` nos emails.

---

## 4. COMO TROCAR TEXTOS

### Fórmula de hero (qualquer nicho)
```
[EYEBROW]   → 3–5 palavras | quem você atende | ex: "PHILADELPHIA'S FINEST"
[TÍTULO]    → Nome da marca OU promessa principal
[SUBTITLE]  → O que você oferece em 1 linha
[VERSÍCULO/TAGLINE] → Uma frase de propósito ou missão
[CTA]       → Verbo de ação + benefício | ex: "BOOK YOUR CLEANING"
```

### Fórmula de seção de serviços
```
[LABEL]     → categoria | "Our Services" ou "What We Do"
[TÍTULO]    → Benefício, não feature | "A clean home, guaranteed"
[SUBTÍTULO] → Um linha complementando
[CARDS]     → Ícone + Nome + Descrição (2 linhas) + Badge (Most Popular)
```

### Fórmula de email welcome
```
Linha 1: "Welcome, [firstName]." — sempre pessoal
Linha 2: Por que a pessoa está aqui (o que ela quer)
Linha 3: O que você oferece que é diferente
CTA:     Ação mais simples possível
Assinatura: Nome do fundador + cargo
```

### Regra de copywriting do projeto
```
NÃO escreva features → escreva transformações
❌ "18k gold-plated jewelry"
✅ "Feel beautiful, confident and intentional every day"

NÃO seja genérico → seja específico
❌ "Professional cleaning services"
✅ "Your home clean in 4 hours or we come back for free"
```

---

## 5. COMO TROCAR IMAGENS

### Estrutura de imagens por página
```
public/images/
├── logo.svg               # Logo da marca
├── founder.png            # Foto do dono/fundadora (opcional mas recomendado)
├── hero-bg.jpg            # Background do hero (opcional)
├── product-1.jpg          # Produtos (jewelry) ou antes/depois (limpeza)
├── product-2.jpg
└── team.jpg               # Foto da equipe (opcional)
```

### Fontes gratuitas de imagens
- Unsplash.com — `https://images.unsplash.com/photo-ID?w=800&q=80`
- Pexels.com — gratuito, alta qualidade
- Fotos reais do negócio — SEMPRE prefira (converte 3x mais)

### Padrão de imagem no código
```html
<!-- Card de produto com 2 fotos (hover swap) -->
<img class="card-img" src="URL-foto-1" alt="Nome do produto" loading="lazy">
<img class="card-img-b" src="URL-foto-2" alt="Nome do produto — detalhe" loading="lazy">

<!-- Before/After limpeza -->
<div class="ba-side"><img src="URL-antes" alt="Antes da limpeza"></div>
<div class="ba-side"><img src="URL-depois" alt="Depois da limpeza"></div>
```

### Regras de imagem
1. Sempre use `loading="lazy"` em imagens abaixo do fold
2. Sempre defina `width` e `height` para evitar layout shift
3. Fotos de produto: proporção 1:1 (quadrado) — funciona melhor no grid
4. Fotos de serviço: proporção 4:3 — before/after ficam melhores
5. Foto da fundadora: mínimo 400×500px, fundo limpo ou externo

---

## 6. COMO TROCAR OFERTAS

### Para produto físico (Jewelry pattern)
```javascript
// Cada produto é um objeto JavaScript no HTML
const products = [
  {
    id: 1,
    name: "Nome do Produto",
    sku: "SKU-001",
    category: "categoria",
    badge: "NEW",          // NEW | HOT | SALE | ""
    img: "URL-foto-1",
    img2: "URL-foto-2",
    imgs: ["URL-1","URL-2","URL-3"],
    prices: { default: 29 },  // pode ter variantes: { S: 25, M: 29, L: 35 }
    variants: ["Tamanho S", "Tamanho M"],
    desc: "Descrição do produto..."
  }
];
```

### Para serviço local (Cleaning pattern)
```html
<!-- Service card estrutura -->
<div class="service-card featured">
  <div class="service-icon">🏠</div>
  <h3>Nome do Serviço</h3>
  <p>Descrição em 2 linhas. Benefício principal e quem precisa.</p>
  <span class="service-tag">Mais Popular</span>
  <span class="service-popular">POPULAR</span>
</div>
```

### Para consultoria (adaptar)
- Remova carrinho e checkout
- Substitua service cards por "pacotes" com preço fixo
- Formulário → calendly embed OU form de qualificação
- Email → envia para calendário do consultor
- Add: página "Sobre mim" expandida com credenciais

### Para curso online (adaptar)
- Remova carrinho de produto físico
- Adicione seção "O que você vai aprender" (bullet list)
- Adicione depoimentos de alunos com resultado específico
- CTA → botão de compra (hotmart/kiwify link) OU formulário de pré-inscrição
- Email welcome → conteúdo de boas-vindas ao curso

### Para marketplace (adaptar)
- Adicione login de vendedor
- Grid de produtos com filtro por vendedor/categoria
- Sistema de avaliação por produto
- Checkout com split de pagamento
- Painel admin expandido com gestão de vendedores

---

## 7. COMO TROCAR CTAs

### Regra de CTA
```
Verbo + Resultado + Urgência (opcional)
✅ "Book My Cleaning Today"
✅ "Shop the Collection"
✅ "Get My Free Quote"
❌ "Submit"
❌ "Click Here"
❌ "Learn More"
```

### CTAs por tipo de negócio
```
Produto físico:   "Shop [Nome]" / "Add to Cart" / "Buy Now"
Serviço local:    "Book My [Serviço]" / "Get Free Quote" / "Call Now"
Consultoria:      "Schedule a Call" / "Apply Now" / "Book a Session"
Curso:            "Enroll Now" / "Get Instant Access" / "Start Learning"
Lead gen:         "Get the Free Guide" / "Download Now" / "Join the List"
WhatsApp:         "Message Me on WhatsApp" / "Chat Now"
```

---

## 8. COMO ADAPTAR PARA CADA TIPO DE NEGÓCIO

### 8.1 Produto físico (ex: roupas, cosméticos, artesanato)
Mudanças em relação ao modelo jewelry:
- Paleta de cores nova (manter estrutura CSS)
- Fotos de produto (manter estrutura de card)
- Preços no JavaScript products array
- Manter: cart, modal, checkout, order emails
- Adicionar: opções de pagamento (PIX, cartão via link)
- Considerar: integração Mercado Pago ou Stripe (substitui Zelle)

### 8.2 Serviço local (ex: pet grooming, jardinagem, pintura)
Baseie-se na página de cleaning. Troque:
- Serviços no grid
- Before/after pelas fotos do seu serviço
- "How it works" steps pelo seu processo
- Área atendida (cities tags)
- FAQ específico do serviço
- Formulário de agendamento (manter estrutura)

### 8.3 Curso online
Nova estrutura de página:
```
Hero → "Quem vai aprender o quê"
Problema → "Por que você ainda não consegue"
Solução → "O que o curso entrega"
Módulos → Lista expandível de conteúdo
Instrutor → Foto + credenciais + história
Depoimentos → Resultados específicos de alunos
Bônus → O que vem junto
Preço → Com âncora de valor
Garantia → "Se não gostar, devolvemos"
FAQ → Objeções mais comuns
CTA final → Comprar / Inscrever
```

### 8.4 Consultoria
```
Hero → Quem você é + resultado que entrega
Credenciais → Logos de clientes, certificações, mídia
Método → Como você trabalha (3–4 passos)
Casos → Resultados reais com números
Serviços → Pacotes com o que está incluso
Depoimentos → De clientes específicos
Agenda → Calendário embed (Calendly)
```

### 8.5 Comunidade de mulheres / empreendedoras
```
Hero → Propósito e pertencimento
Sobre → Quem é a criadora e sua missão
Benefícios → O que os membros recebem
Depoimentos → Histórias de transformação
Planos → Free, Premium, VIP
CTA → "Quero fazer parte"
Newsletter → Sequência de conteúdo educativo
```

---

## 9. CHECKLIST ANTES DE LANÇAR

### Técnico
- [ ] `.env` configurado com todas as variáveis
- [ ] Supabase: tabelas criadas (jewelry_orders, email_queue, newsletter_subscribers)
- [ ] Gmail App Password gerado (2FA ativo na conta)
- [ ] Vercel project linked e `.vercel/project.json` presente
- [ ] GitHub repository conectado ao Vercel
- [ ] `CRON_SECRET` configurado no Vercel
- [ ] Health check respondendo: `curl https://seudominio.app/api/health`
- [ ] Email de teste enviado com sucesso
- [ ] Formulário de agendamento testado end-to-end

### Visual
- [ ] Todas as imagens carregando (sem 404)
- [ ] Fotos da fundadora/equipe adicionadas (ou removidas)
- [ ] Logo SVG funcionando em todos os emails
- [ ] Responsivo testado em mobile (375px), tablet (768px), desktop (1280px)
- [ ] Cores consistentes em toda a página (sem fundo errado em alguma seção)
- [ ] Newsletter popup com timing correto (6–10s)

### Conteúdo
- [ ] Título da página (`<title>`) correto para SEO
- [ ] Meta description com palavra-chave principal + localização
- [ ] Schema.org type correto para o negócio
- [ ] WhatsApp número correto em todos os links
- [ ] Email de contato correto
- [ ] Endereço/cidade corretos no rodapé e Schema.org
- [ ] Telefone formatado corretamente

### Comercial
- [ ] Preços corretos nos produtos
- [ ] Descrições de serviços revisadas
- [ ] CTAs apontando para ações corretas (WhatsApp, formulário, produto)
- [ ] Sequência de emails revisada e testada
- [ ] Admin panel acessível e funcional
- [ ] Pelo menos 3 reviews/depoimentos reais

---

## 10. ERROS QUE DEVEMOS EVITAR

### Erro técnico #1: Começar sem definir o .env
> Resultado: emails não saem, banco não conecta, deploy funciona mas tudo quebra.  
> Fix: configure o .env ANTES de qualquer teste.

### Erro técnico #2: Usar senha Gmail normal (não App Password)
> Resultado: erro 535 "Invalid login" no nodemailer.  
> Fix: ative 2FA → gere App Password de 16 dígitos em myaccount.google.com/apppasswords.

### Erro técnico #3: Editar produto no admin sem Supabase sincronizado
> Resultado: mudanças somem ao trocar de dispositivo.  
> Fix: sempre PUT para Supabase ao salvar (veja o padrão de saveProduct()).

### Erro visual #1: Usar border-radius em email para círculos
> Resultado: Outlook mostra quadrado.  
> Fix: use `<img>` com SVG hospedado, ou tabela com `mso-` fallback.

### Erro visual #2: Imagens sem dimensões explícitas em emails
> Resultado: Gmail colapsa imagem ou layout quebra.  
> Fix: sempre declare `width="XX" height="XX"` no `<img>` de email.

### Erro de estratégia #1: Lançar sem sequência de email
> Resultado: cliente esquece a marca em 48h.  
> Fix: mínimo 3 emails pós-cadastro (welcome, follow-up, reengagement).

### Erro de estratégia #2: CTA genérico ("Submit", "Send")
> Resultado: taxa de clique 60% menor.  
> Fix: use verbos de ação com benefício ("Book My Free Cleaning").

### Erro de estratégia #3: Não mostrar a fundadora/dono
> Resultado: site parece loja anônima, converte menos.  
> Fix: foto real + nome + título + história em pelo menos 1 seção.

### Erro de custo #4: Reescrever componentes já prontos
> Resultado: gasta tokens, tempo e introduz bugs.  
> Fix: copie os componentes do Lagos World e apenas troque cores + textos.

---

## 11. ORDEM IDEAL PARA CONSTRUIR UMA NOVA VERSÃO

### Fase 1 — Configuração (30 min)
```
1. Criar repositório GitHub
2. Copiar estrutura Lagos World
3. Configurar .env
4. Criar projeto Supabase + rodar SQL das tabelas
5. Gerar Gmail App Password
6. Linkar ao Vercel
7. Testar health check
```

### Fase 2 — Identidade Visual (1h)
```
1. Definir paleta de 4 cores no :root
2. Escolher 2 fontes (display + body)
3. Criar logo SVG
4. Escolher 5–10 imagens iniciais
5. Aplicar cores nas CSS vars (find & replace)
```

### Fase 3 — Conteúdo (2h)
```
1. Hero: eyebrow + título + subtítulo + CTA
2. Seção de serviços/produtos: nome + descrição + ícone
3. How it works: 3–4 passos
4. Reviews: 3–6 depoimentos reais
5. FAQ: 5–8 perguntas + respostas
6. Footer: contato + links
```

### Fase 4 — Emails (1h)
```
1. Adaptar emailTemplates.js (troque paleta, textos, marca)
2. Escrever sequência de welcome (3 emails)
3. Escrever email de confirmação de pedido/agendamento
4. Testar envio para 2 emails
```

### Fase 5 — SEO (30 min)
```
1. <title> com keyword principal + localização
2. <meta description> com benefício + localização
3. Schema.org correto (LocalBusiness, Service, Product)
4. Canonical URL
5. Open Graph tags
```

### Fase 6 — QA e Launch
```
1. Testar formulário end-to-end (submit → email → admin)
2. Testar carrinho + checkout (se e-commerce)
3. Testar responsivo mobile
4. Deploy produção
5. Testar em domínio real
```

**Tempo total estimado: 5–6 horas para um novo site completo.**

---

*Replication Guide gerado com base no projeto Lagos World (lagosworld.app).*
