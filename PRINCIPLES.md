# PRINCIPLES — O que evitar e a ordem correta de construção

> Documento de princípios extraído das lições do projeto Lagos World.
> Leia antes de qualquer nova sessão de desenvolvimento.

---

## ERROS A EVITAR

### Erro 1 — Pedir "crie outro site igual"
Faz o Claude gastar tokens recriando raciocínio do zero.

❌ Ruim:
```
"Crie um site igual ao Lagos World mas para power washing."
```

✅ Correto:
```
"Use o blueprint existente. Adapte somente conteúdo, cores, imagens, CTAs e ofertas."
```

---

### Erro 2 — Texto espalhado no código

Quando o conteúdo está hardcoded no HTML, trocar o negócio exige mexer em centenas de linhas.

❌ Ruim: texto fixo dentro do componente
```html
<h2>Lagos Cleaning Services</h2>
<p>House cleaning in Philadelphia, PA</p>
```

✅ Correto: conteúdo centralizado em arquivos de configuração
```
businessConfig.js   → nome, slogan, contato, localização
services.js         → lista de serviços com ícone, nome, descrição, tag
products.js         → catálogo de produtos com fotos, variantes, preços
navigation.js       → links, CTAs, labels do menu
seo.js              → title, description, keywords, schema.org por página
```

O componente só lê os dados. Nunca escreve o conteúdo diretamente.

---

### Erro 3 — Criar componente novo para cada variação

❌ Ruim: um componente por nicho
```
CleaningServiceCard.js
JewelryProductCard.js
CourseCard.js
```

✅ Correto: componentes genéricos que recebem dados
```
ServiceCard     → recebe { icon, title, description, tag, featured }
ProductCard     → recebe { name, price, images, badge, variants }
CourseCard      → recebe { title, duration, level, price, modules }
HeroSection     → recebe { eyebrow, title, subtitle, cta, card }
CTASection      → recebe { title, description, button, background }
TestimonialSection → recebe { reviews[], rating, count }
FAQSection      → recebe { items[] }
```

Para replicar o site: troca os dados, não os componentes.

---

### Erro 4 — Misturar design com conteúdo

O design deve ser fixo. O conteúdo deve ser editável.

❌ Ruim: conteúdo dentro do componente
```javascript
function ServiceCard() {
  return (
    <div>
      <h3>House Cleaning & Sanitizing</h3>
      <p>Professional residential cleaning in Philadelphia...</p>
    </div>
  )
}
```

✅ Correto: componente recebe conteúdo como dado
```javascript
// services.js
export const services = [
  {
    icon: '🏠',
    title: 'House Cleaning & Sanitizing',
    description: 'Professional residential cleaning...',
    tag: 'Most Popular',
    featured: true
  }
]

// ServiceCard recebe via props — nunca define o texto dentro de si
function ServiceCard({ icon, title, description, tag, featured }) { ... }
```

---

## MODELO IDEAL PARA NOVO PROJETO

Para cada novo negócio, preencha apenas este bloco.
O sistema adapta o template a partir dele.

```
Nome do negócio:
Nicho:
Cidade / localização:
Público-alvo:
Oferta principal:
Oferta secundária:
Problema que resolve:
Benefício principal:
Tom da marca:           [ ] elegante  [ ] profissional  [ ] próximo  [ ] urgente
Cor primária:           #HEX
Cor secundária:         #HEX

Serviços:
  1.
  2.
  3.

Produtos:
  1. [nome] — $[preço]
  2. [nome] — $[preço]

Cursos:
  1.

CTA principal:
CTA secundário:
WhatsApp:               +1XXXXXXXXXX
Calendly / booking URL:

Depoimentos:
  1. "[texto]" — Nome, Cidade
  2. "[texto]" — Nome, Cidade
  3. "[texto]" — Nome, Cidade

Fotos disponíveis:      [ ] fundador  [ ] produto  [ ] serviço  [ ] antes/depois
Palavras-chave SEO:
Domínio:
```

---

## A ORDEM CORRETA DE CONSTRUÇÃO

Nunca pule etapas. Cada etapa alimenta a seguinte.

```
1. MAPEAR O QUE FOI FEITO
   → Ler PROJECT_BLUEPRINT.md + COMPONENT_MAP.md
   → Entender o que existe e o que pode ser reutilizado

2. DOCUMENTAR A ARQUITETURA
   → Confirmar que os 6 arquivos .md estão atualizados
   → Se algo foi construído sem documentar, documentar antes de avançar

3. SEPARAR CONTEÚDO DA ESTRUTURA
   → Identificar onde texto está hardcoded no HTML
   → Mover para arquivos de configuração (services.js, products.js, etc.)
   → Componentes passam a receber dados por props/params

4. CRIAR ARQUIVOS DE CONFIGURAÇÃO
   → businessConfig.js   (dados do negócio)
   → services.js         (serviços com props completos)
   → products.js         (catálogo)
   → seo.js              (meta tags, schema.org)
   → navigation.js       (links, CTAs)

5. CRIAR COMPONENTES REUTILIZÁVEIS
   → ServiceCard, ProductCard, HeroSection, CTASection
   → Cada componente aceita dados via parâmetros
   → Zero texto hardcoded dentro dos componentes

6. CRIAR PROMPT MESTRE DE REPLICAÇÃO
   → START_NEW_PROJECT.md
   → TEMPLATE_REFACTOR_PLAN.md
   → BUSINESS_TEMPLATE.md preenchível

7. SÓ ENTÃO CRIAR NOVOS SITES
   → Preenche o modelo de configuração
   → Claude injeta os dados nos componentes
   → Troca cores no :root
   → Publica
```

**Custo estimado de cada etapa quando a ordem é respeitada:**
```
Etapas 1–3:  ~5k tokens (análise + refactor leve)
Etapa 4–5:   ~10k tokens (criar configs + componentes genéricos)
Etapa 6:     ~5k tokens (prompts e templates)
Etapa 7:     ~15k tokens por novo site
─────────────────────────────────────────
Total setup: ~20k tokens (investimento único)
Por site:    ~15k tokens (vs. 55–80k sem a estrutura)
```

---

## O ATIVO REAL

O ativo não é o `lagosworld.app`.

O ativo é o **modelo operacional replicável**:
- Arquitetura que qualquer negócio pode usar
- Componentes que aceitam qualquer conteúdo
- Sistema de email que dispara automaticamente
- Admin panel que qualquer dono consegue operar
- Documentação que permite replicar em 8 horas

Cada novo negócio que usa esse modelo custa menos tempo, menos tokens e entrega mais qualidade — porque o raciocínio já foi feito uma vez e está documentado.

---

*Principles v1.0 — extraído das lições do projeto Lagos World.*
