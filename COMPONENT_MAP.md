# COMPONENT MAP — Lagos World

> Mapa completo de todos os componentes do projeto, com função, localização,
> reutilizabilidade e instruções de adaptação.

---

## LEGENDA
- 🟢 **Reutilizável universal** — copie sem mudança estrutural
- 🟡 **Reutilizável com adaptação** — troque cores/textos/dados
- 🔴 **Específico** — reescreva para o novo negócio
- 📁 Arquivo onde o componente está
- ⚙️ Props/parâmetros que recebe

---

## CATEGORIA: LAYOUT BASE

### NavBar — Jewelry
📁 `public/jewelry/index.html` (linha ~50)  
🟡 Reutilizável com adaptação  
**Função**: navegação sticky no topo, filtro de categorias scrollável, botão carrinho com badge  
**Onde aparece**: topo fixo de toda a página jewelry  
**Elementos**:
- `.nav-brand` — nome da marca com gradiente ouro animado
- `.nav-cats` — lista de categorias com underline animado no ativo
- `.cart-btn` — botão com contador de itens no carrinho

**Adaptar**: Troque `.nav-cats` pelos filtros do seu produto. Para serviço local, substitua por links de âncora para seções da página.

---

### NavBar — Cleaning
📁 `public/cleaning/index.html` (linha ~101)  
🟢 Reutilizável universal  
**Função**: navegação profissional com logo, links de âncora, botões de ação  
**Onde aparece**: topo fixo de toda a página cleaning  
**Elementos**:
- `.nav-logo` — marca com subtítulo
- `.nav-links` — links de âncora para seções
- `.nav-actions` — botão primário + botão WhatsApp

**Adaptar**: Mude marca, links e cores. Estrutura serve para qualquer serviço local.

---

### Top Bar
📁 `public/cleaning/index.html` (linha ~96)  
🟢 Reutilizável universal  
**Função**: barra de aviso/promoção no topo da página  
**Onde aparece**: acima da navbar, sempre visível  
**Copy modelo**: "📞 Free estimates — Call +1 (XXX) XXX-XXXX · Areas served: PA & NJ"  
**Adaptar**: Troque número, áreas, mensagem de urgência.

---

### Footer — Jewelry
📁 `public/jewelry/index.html` (linha ~322)  
🟡 Reutilizável com adaptação  
**Função**: rodapé com logo, versículo, 3 colunas de links  
**Estrutura de 3 colunas**: Shop | Help | Brand  
**Adaptar**: Troque versículo/tagline, links, nome da marca. Mude `.footer-cross` para outro ornamento se o nicho não for religioso.

---

### Footer — Cleaning
📁 `public/cleaning/index.html` (linha final)  
🟢 Reutilizável universal  
**Função**: rodapé clean com contato, rating, links legais  
**Adaptar**: Troque contato e links. Mantenha estrutura.

---

## CATEGORIA: HERO SECTIONS

### Hero — Jewelry (Dark Luxury)
📁 `public/jewelry/index.html` (linha ~26)  
🟡 Reutilizável com adaptação  
**Função**: primeira tela de impacto — visual antes de texto  
**Elementos**:
- `.hero-grid` — grade sutil dourada no fundo
- `.hero-glow` — halo de luz central animado
- `.particle` — partículas JS flutuantes (15–20 unidades)
- `.hero-cross` — ornamento animado (✝ ou ✦)
- `.hero-eyebrow` — label acima do título
- `.hero-title` — nome da marca com gradiente ouro animado
- `.hero-subtitle` — Playfair Display italic
- `.hero-verse` — tagline/versículo
- `.hero-cta` — botão de ação com shimmer fill
- Founder photo — `position:absolute;bottom:0;left:0` com mask gradient

**Adaptar**: Troque paleta dourada para a cor primária do seu negócio. Remova partículas para nichos mais sóbrios. Mantenha a estrutura de eyebrow → título → subtítulo → CTA.

**JavaScript necessário**:
```javascript
// Criar partículas (adapte color para sua cor primária)
function createParticle() {
  const p = document.createElement('div');
  p.className = 'particle';
  p.style.cssText = `
    left:${Math.random()*100}%;
    width:${Math.random()*3+1}px; height:${Math.random()*3+1}px;
    background:rgba(201,168,76,${Math.random()*.4+.1});
    animation-duration:${Math.random()*10+8}s;
    animation-delay:${Math.random()*5}s;
  `;
  document.querySelector('.hero').appendChild(p);
}
for(let i=0;i<18;i++) createParticle();
```

---

### Hero — Cleaning (Split Grid)
📁 `public/cleaning/index.html` (linha ~124)  
🟢 Reutilizável universal  
**Função**: hero de conversão com informação + card de prova  
**Estrutura**: `grid-template-columns: 1.1fr 0.9fr`  
**Coluna esquerda**: badge, título, subtítulo, 2 CTAs, trust badges  
**Coluna direita**: `.hero-card` com rating, stars, quote, estatísticas  
**Adaptar**: Mude números, quote e estatísticas. A estrutura duas colunas serve para qualquer serviço local.

---

## CATEGORIA: SEÇÕES DE SERVIÇOS E PRODUTOS

### Product Grid — Jewelry (Catalog)
📁 `public/jewelry/index.html` (linha ~101)  
🟡 Reutilizável com adaptação  
**Função**: grid de 4 colunas de produtos com filtros, busca e paginação  
**Componentes filhos**: `ProductCard`, `FilterBar`, `SearchBar`, `Pagination`  
**Paginação**: 40 itens/página, JS client-side  
**Adaptar**: Mantenha grid, card e pagination. Troque os dados do array `products[]` e as cores.

---

### Product Card
📁 `public/jewelry/index.html` (linha ~106)  
🟢 Reutilizável universal  
**Função**: card de produto com hover image swap, badge, preço, quick add  
**Elementos**:
- `.card-imgs` — wrapper das 2 fotos
- `.card-img` / `.card-img-b` — foto 1 / foto 2 (troca no hover)
- `.card-badge` — NEW | HOT | SALE | SET
- `.card-overlay` — gradiente escuro no hover
- `.card-action` — "QUICK ADD" botão deslizante
- `.zoom-hint` — ícone de zoom
- `.card-info` — nome, SKU, categoria, preço
**Adaptar**: Troque dados dos produtos. Para serviços, remova `.card-action` e adicione "Book Now".

---

### Service Cards Grid — Cleaning
📁 `public/cleaning/index.html` (linha ~190)  
🟢 Reutilizável universal  
**Função**: grid de 3 colunas mostrando os serviços  
**Service card estrutura**:
- ícone emoji (48px)
- título do serviço
- descrição (2 linhas)
- tag (Most Popular / Residential / Commercial)
- badge "POPULAR" no canto superior direito
- topo colorido que aparece no hover
**Adaptar**: Troque serviços, ícones e tags. Mantenha `.featured` para o serviço principal.

---

### Elite Service Section (Power Wash)
📁 `public/cleaning/index.html` (linha ~208)  
🟡 Reutilizável com adaptação  
**Função**: seção de destaque para oferta premium — background escuro, copy de autoridade  
**Estrutura**: texto + lista de benefícios | grid 2×2 de mini-cards  
**Usar quando**: você tem uma oferta premium que precisa de destaque diferente do resto  
**Adaptar**: Troque cores de fundo (navy para seu primário escuro), texto e benefícios.

---

### Before/After Gallery
📁 `public/cleaning/index.html` (linha ~164)  
🟡 Reutilizável com adaptação  
**Função**: galeria de fotos antes/depois com divider visual  
**Estrutura**:
```html
<div class="ba-card">
  <div class="ba-images">
    <div class="ba-side"><img src="antes.jpg"><span class="ba-label before">Before</span></div>
    <div class="ba-side"><img src="depois.jpg"><span class="ba-label after">After</span></div>
    <div class="ba-divider"></div>
  </div>
  <div class="ba-info">
    <span class="ba-service">House Deep Clean</span>
    <span class="ba-tag">Residential</span>
  </div>
</div>
```
**Adaptar**: Substitua fotos pelo seu serviço. Funciona para: reforma, jardinagem, pintura, pet grooming.

---

## CATEGORIA: CARDS

### Product Modal (Lightbox)
📁 `public/jewelry/index.html` (linha ~141)  
🟡 Reutilizável com adaptação  
**Função**: modal de produto com galeria de fotos, thumbnails, zoom, variantes e add-to-cart  
**Elementos**:
- `.modal-media` — galeria esquerda com main image + thumbnails
- `.modal-nav` — setas de navegação entre fotos
- `.modal-body` — direita: nome, categoria, descrição, variantes, preço, botão
- `.modal-vars` — botões de variante (tamanho, cor)
- `.modal-perks` — ícones de benefício (free shipping, returns)
**Adaptar**: Para serviços, substitua variantes por "escolha o dia" ou "tipo de serviço".

---

### Review Cards
📁 `public/cleaning/index.html` (linha ~270)  
🟢 Reutilizável universal  
**Função**: depoimentos com stars, texto, autor e data  
**Adaptar**: Apenas o conteúdo. Estrutura é universal.

---

### Rating Summary Bar
📁 `public/cleaning/index.html` (linha ~281)  
🟢 Reutilizável universal  
**Função**: resumo de avaliações (nota grande + barras de 5★ a 1★)  
**Adaptar**: Troque números. Mantém-se igual para qualquer negócio.

---

### Promotion Cards (3 variações)
📁 `public/cleaning/index.html` (linha ~240)  
🟢 Reutilizável universal  
**3 tipos**: First-time (azul) | Referral (verde) | Seasonal (âmbar)  
**Adaptar**: Troque cores, textos e códigos de desconto.

---

## CATEGORIA: BOTÕES

### Gold CTA Button (Jewelry)
📁 `api/services/emailTemplates.js` — função `btn(text, url)`  
📁 `public/jewelry/index.html` — `.hero-cta`, `.co-btn`, `.submit-btn`  
🟢 Reutilizável universal  
**Padrão**:
```css
background: linear-gradient(135deg, var(--gold-d), var(--gold), var(--gold-l));
color: #0d0d0d;
letter-spacing: .4em;
text-transform: uppercase;
font-size: .65rem;
```

### Teal CTA Button (Cleaning)
📁 `public/cleaning/index.html` — `.btn-primary`, `.form-submit`  
🟢 Reutilizável universal  
```css
background: #0891B2;
color: #fff;
border-radius: 4px;
font-weight: 700;
```

### Outline Button
📁 `public/cleaning/index.html` — `.btn-outline`  
🟢 Reutilizável universal  
```css
border: 1.5px solid var(--teal);
background: transparent;
color: var(--teal);
/* hover: fill com cor primária */
```

### WhatsApp Float Button
📁 `public/cleaning/index.html` (final do body)  
🟢 Reutilizável universal  
```html
<a href="https://wa.me/NUMERO" style="position:fixed;bottom:1.5rem;right:1.5rem;
   z-index:999;width:52px;height:52px;background:#25D366;border-radius:50%;
   display:flex;align-items:center;justify-content:center;
   box-shadow:0 4px 16px rgba(37,211,102,.4)">
  <svg><!-- WhatsApp icon --></svg>
</a>
```

---

## CATEGORIA: FORMULÁRIOS

### Checkout Form (Jewelry)
📁 `public/jewelry/index.html` (linha ~214)  
🔴 Específico — mas pode ser simplificado  
**Função**: formulário completo de checkout com dados do cliente, endereço, ZIP detection, pagamento (Zelle/Cash), upload de comprovante  
**Adaptar para produto**: mude opções de pagamento para PIX/Stripe link  
**Adaptar para serviço**: remova pagamento, deixe apenas dados do cliente

---

### Booking Form (Cleaning)
📁 `public/cleaning/index.html` (linha ~307)  
🟢 Reutilizável universal  
**Função**: formulário de agendamento com dados + tipo de serviço + data preferida + recorrência  
**Campos**: nome, email, telefone | serviço, recorrência | endereço, cidade | data preferida | notas  
**Submit**: `POST /api/cleaning/requests` → email automático → admin notificado  
**Adaptar**: Troque opções de serviço. Mantenha a estrutura de 2 colunas + submit.

```javascript
// Submit handler padrão
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const res = await fetch('/api/cleaning/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (res.ok) showSuccess();
  else showError();
});
```

---

### Newsletter Popup
📁 `public/jewelry/index.html` (final — ID `jewelry-popup`)  
📁 `public/cleaning/index.html` (final — ID `cleaning-popup`)  
🟢 Reutilizável universal  
**Função**: popup de captura de email com delay configurável  
**Timing**: `setTimeout(() => { popup.classList.add('visible') }, 8000)`  
**Submit**: `POST /api/newsletter/subscribe` com `{ email, name, source }`  
**Adaptar**: Troque cores, copy e source identifier.

---

## CATEGORIA: SEÇÕES DE AUTORIDADE

### "How It Works" Steps
📁 `public/cleaning/index.html` (linha ~228)  
🟢 Reutilizável universal  
**Função**: explica o processo do negócio em 4 passos numerados  
**Estrutura**: grid 4 colunas com número circular, ícone, título e descrição  
**Linha conectora**: pseudo-element `::before` horizontal entre os steps  
**Adaptar**: Troque número de steps e textos. Para e-commerce: Browse → Add → Checkout → Receive.

---

### Founder/Team Section
📁 `public/jewelry/index.html` — hero `dayane-1.png` + email brand story  
🟡 Reutilizável com adaptação  
**Função**: humaniza a marca com foto real + nome + título + história  
**Padrão jewelry (hero)**: foto absoluta, bottom-left, mask gradient para fade direita  
**Padrão email**: foto circular 64px + nome + cargo em tabela horizontal  
**Adaptar**: Substitua fotos e bio. Mantenha a posição e o estilo.

---

### Service Area Map
📁 `public/cleaning/index.html` — `.areas-grid`  
🟡 Reutilizável com adaptação  
**Função**: lista de cidades/estados atendidos em grid com pills de cidade  
**Adaptar**: Troque estados e cidades. Remova se negócio for online/nacional.

---

### Trust Badges Bar
📁 `public/cleaning/index.html` — `.hero-trust`  
🟢 Reutilizável universal  
**Função**: ícones de confiança logo abaixo dos CTAs do hero  
**Exemplos**: ✓ Bonded & Insured | ✓ Same-day Response | ✓ 4.9★ Rating | ✓ Satisfaction Guaranteed  
**Adaptar**: Troque ícones e textos para os garantidores do seu negócio.

---

## CATEGORIA: SEÇÕES DE PROVA SOCIAL

### Review Grid (3 colunas)
📁 `public/cleaning/index.html` — `.reviews-grid`  
🟢 Reutilizável universal  
**Adaptar**: Apenas o conteúdo. Estrutura é universal.

### Rating Stars Hero Card
📁 `public/cleaning/index.html` — `.hero-card`  
🟢 Reutilizável universal  
**Dados**: nota, número de reviews, quote de depoimento, 2 estatísticas  
**Adaptar**: Troque números e quote.

### Stat Numbers
📁 `public/cleaning/index.html` — `.hs` dentro do `.hero-stat`  
🟢 Reutilizável universal  
**Padrão**: número grande (Playfair Display, cor de destaque) + label pequeno  
**Exemplos**: 500+ / Homes Cleaned | 4.9★ / Average Rating | 2h / Response Time  

---

## CATEGORIA: ELEMENTOS VISUAIS

### Gold Ornament (✦ ─── ✦ ─── ✦)
📁 `public/jewelry/index.html` — `.orn`  
🟡 Reutilizável com adaptação  
**Função**: separador decorativo entre seções  
```html
<div class="orn">
  <span></span><i>✦</i><span></span>
</div>
```

### Section Label Pill
📁 `public/cleaning/index.html` — `.section-label`  
🟢 Reutilizável universal  
```html
<span class="section-label">Our Services</span>
```

### Eyebrow + Title Pattern (Jewelry)
```html
<span class="section-cross">✦</span>
<span class="section-eyebrow">THE COLLECTION</span>
<h2 class="section-title">Lagos Jewelry</h2>
<span class="section-italic">Elegance for every day</span>
<div class="orn">...</div>
<p class="section-verse">"She is clothed with strength"</p>
```

### Shipping Progress Bar
📁 `public/jewelry/index.html` — `.ship-progress`  
🟡 Reutilizável com adaptação  
**Função**: mostra progresso até frete grátis (atualiza com cada item no cart)  
```javascript
function updateShipBar() {
  const remaining = 50 - cartTotal;
  if (remaining <= 0) shipMsg.textContent = '🎉 Free shipping unlocked!';
  else shipMsg.textContent = `$${remaining.toFixed(2)} away from free shipping`;
  shipBar.style.width = Math.min((cartTotal / 50) * 100, 100) + '%';
}
```

---

## CATEGORIA: COMPONENTES DE CONVERSÃO

### Cart Sidebar (Drawer)
📁 `public/jewelry/index.html` — `.cart`, `.cart-veil`  
🔴 Específico para e-commerce  
**Função**: carrinho lateral que desliza da direita  
**Estado**: localStorage `lagos_cart` array de objetos  
**Adaptar**: Manter para qualquer venda de produto. Remover para serviço puro.

### Checkout Modal
📁 `public/jewelry/index.html` — `.co-veil`, `.co-box`  
🔴 Específico — mas estrutura de modal é reaproveitável  
**Função**: modal fullscreen de checkout com order summary, dados do cliente, pagamento  
**Padrão de modal reutilizável**:
```css
.modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:500;
                 display:flex;align-items:center;justify-content:center;
                 opacity:0;pointer-events:none;transition:opacity .3s }
.modal-overlay.open { opacity:1;pointer-events:all }
```

### Admin Panel
📁 `public/admin/index.html`  
🟡 Reutilizável com adaptação  
**Função**: painel de gestão com múltiplas abas  
**Abas**: Orders | Cleaning | Products | Emails | (customizável)  
**Adaptar**: Adicione/remova abas conforme o negócio. Mantenha estrutura de tabs + tables.

### Toast Notification
📁 `public/jewelry/index.html` — `.toast`  
🟢 Reutilizável universal  
```javascript
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}
```

### FAQ Accordion
📁 `public/cleaning/index.html` — `.faq-list`  
🟢 Reutilizável universal  
```javascript
document.querySelectorAll('.faq-q').forEach(q => {
  q.addEventListener('click', () => {
    const item = q.parentElement;
    item.classList.toggle('open');
    q.nextElementSibling.classList.toggle('open');
  });
});
```

---

## CATEGORIA: COMPONENTES DE EMAIL

### Jewelry Email Wrapper (`wrap()`)
📁 `api/services/emailTemplates.js` — função `wrap(content, previewText)`  
🟡 Reutilizável com adaptação  
**Gera**: HTML completo com header, logo, watermark, corpo, footer  
**Adaptar**: Troque paleta (dark → claro), logo, marca, links do footer.

### Cleaning Email Wrapper (`wrap()`)
📁 `api/services/cleaningEmailTemplates.js` — função `wrap(content, previewText)`  
🟢 Reutilizável universal para serviços  
**Cores**: teal header + white body + footer cinza claro  
**Adaptar**: Troque cor do header para a primária do negócio.

### Email Button (`btn(text, url)`)
📁 Ambos emailTemplates.js  
🟢 Reutilizável universal  
```javascript
function btn(text, url) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0">
    <tr><td style="background:#COR;padding:15px 38px">
      <a href="${url}" style="color:#fff;font-size:13px;letter-spacing:2px;
         text-decoration:none;font-weight:bold">${text.toUpperCase()}</a>
    </td></tr>
  </table>`;
}
```

### Email Admin Notification
📁 `api/services/emailTemplates.js` — `adminNotification(subject, details)`  
📁 `api/services/cleaningEmailTemplates.js` — `cleaningAdminNotification(data)`  
🟢 Reutilizável universal  
**Adaptar**: Para qualquer tipo de evento de negócio (novo pedido, novo lead, novo cadastro).

### Email Queue System
📁 `api/services/email.js` — `processDueEmails(supabase)`  
📁 `api/routes/cron.js` — `GET /api/cron/emails`  
🟢 Reutilizável universal  
**Como funciona**: insere em `email_queue` com `email_type` + `scheduled_at` → cron processa diariamente  
**Adicionar novo tipo**:
1. Criar template em emailTemplates.js
2. Adicionar case no switch de processDueEmails()
3. Adicionar ao objeto templates em cron.js POST /send
4. Inserir na fila com o novo email_type ao criar o evento

---

## RESUMO DE REAPROVEITAMENTO

| Componente | Reusar? | Tempo de adaptação |
|-----------|---------|-------------------|
| NavBar Cleaning | ✅ Sim | 10 min |
| Hero Split Grid | ✅ Sim | 20 min |
| Service Cards Grid | ✅ Sim | 15 min |
| How It Works Steps | ✅ Sim | 10 min |
| Review Cards | ✅ Sim | 10 min |
| FAQ Accordion | ✅ Sim | 10 min |
| Booking Form | ✅ Sim | 15 min |
| Newsletter Popup | ✅ Sim | 10 min |
| WhatsApp Float | ✅ Sim | 5 min |
| Email Wrapper (Cleaning) | ✅ Sim | 15 min |
| Email Queue System | ✅ Sim | 0 min |
| Admin Panel | ✅ Sim | 30 min |
| Hero Jewelry (dark luxury) | 🔶 Adaptar | 45 min |
| Product Grid + Cards | 🔶 Adaptar | 30 min |
| Cart + Checkout | ❌ Reescreva | 2–3h |
| Product Modal | ❌ Reescreva | 1–2h |

---

*Component Map gerado com base no código-fonte do projeto Lagos World.*
