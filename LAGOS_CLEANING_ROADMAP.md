# Lagos Cleaning — Roadmap Domínio Separado

> Decisão: SIM, separar vale. Timing: registre o domínio agora, construa em fases.
> Análise completa gerada em 2026-05-28.

---

## FASE 1 — Registrar domínio + GMB (esta semana, custo ~$15/ano)

### 1. Registrar domínio

**Domínio recomendado:** `lagoscleaningpa.com`
- Inclui "PA" → sinal de relevância local para Philadelphia/PA
- Alternativas: `lagoscleaning.com`, `lagosclean.com`

**Onde registrar:**
1. Acesse **Namecheap.com** ou **Cloudflare Registrar** (mais barato)
2. Busque `lagoscleaningpa.com`
3. Compre por ~$10-15/ano
4. Após comprar: vá em DNS settings → adicione um CNAME record:
   ```
   Tipo:  CNAME
   Nome:  www
   Valor: cname.vercel-dns.com
   ```
5. No Vercel Dashboard → seu projeto → Settings → Domains → Add Domain → `lagoscleaningpa.com`
6. Vercel gera SSL automático em ~2 minutos

**Enquanto o site dedicado não está pronto:**
- Configure redirect no Vercel: `lagoscleaningpa.com` → `lagosworld.app/cleaning`
- Adicione em `vercel.json`:
  ```json
  "redirects": [
    { "source": "/", "destination": "https://lagosworld.app/cleaning", "permanent": false }
  ]
  ```

---

### 2. Configurar Google My Business (GRATUITO — prioridade máxima)

Google Maps é onde 70%+ dos leads de cleaning começam.

**Passo a passo:**

1. Acesse **business.google.com** com a conta Google da Lagos
2. Clique "Adicionar empresa"
3. **Nome da empresa:** `Lagos Cleaning Services`
4. **Categoria principal:** `House Cleaning Service`
5. **Categorias secundárias:** `Power Washing Service`, `Maid Service`, `Janitorial Service`
6. **Área de serviço** (não endereço físico):
   - Philadelphia, PA
   - Cherry Hill, NJ
   - Delaware County, PA
   - Bucks County, PA
   - South Jersey (selecione cidades: Camden, Marlton, Voorhees, Haddonfield)
7. **Telefone:** número da Lagos Cleaning
8. **Website:** `lagoscleaningpa.com` (ou `lagosworld.app/cleaning` enquanto não está pronto)
9. **Verificação:** Google envia código por carta (~5 dias) ou ligação

**Após verificação — otimizar o perfil:**
- Adicionar 10+ fotos (antes/depois, equipe, equipamentos)
- Escrever descrição com palavras-chave: "house cleaning Philadelphia", "move-in move-out cleaning", "Airbnb cleaning service"
- Configurar horários de funcionamento
- Ativar "Mensagens" para leads direto pelo Google Maps
- Criar primeiro post: "Novo serviço: Limpeza para Airbnb — pronto para o próximo hóspede em 3h"

---

## FASE 2 — Site dedicado (próximas 2-4 semanas)

### Estrutura de páginas por prioridade

| Prioridade | URL | Por quê |
|---|---|---|
| 🔥 1º | `/airbnb-cleaning` | Maior ticket, recorrente, hosts desesperados por confiança |
| 🔥 2º | `/move-in-move-out` | Alta intenção de compra, pesquisa muito específica |
| 3º | `/` | Homepage geral com todos os serviços |
| 4º | `/recurring` | Planos mensais/quinzenais — foco em LTV |
| 5º | `/power-washing` | Cross-sell natural para clientes existentes |
| 6º | `/post-construction` | Menor volume, ticket mais alto |

### Começar pela landing page Airbnb

**Arquivo:** `public/airbnb-cleaning/index.html`

**Estrutura da página:**
```
[Hero] "Your Airbnb, guest-ready in 3 hours"
[Social proof] "Trusted by 40+ hosts in Philadelphia & South Jersey"
[Benefits] Flexible scheduling · Supplies included · Damage report with photos
[Services] Turnover clean · Deep clean · Laundry · Restock checklist
[Pricing] From $120 per turnover (based on bedrooms)
[CTA] "Get a quote" → form atual (mesmo backend)
[FAQ] How fast? Can you handle same-day? Do you photograph the unit?
[Reviews] Google reviews embed
```

**Keywords para essa página:**
- "Airbnb cleaning service Philadelphia"
- "vacation rental cleaning South Jersey"
- "turnover cleaning service Delaware County"
- "short term rental cleaning PA"

---

## FASE 3 — SEO local (contínuo)

### Checklist básico

- [ ] Meta title cada página: `Airbnb Cleaning Service Philadelphia PA | Lagos Cleaning`
- [ ] Meta description com CTA: `Professional Airbnb turnover cleaning in Philadelphia & South Jersey. Same-day available. Get a free quote.`
- [ ] Heading H1 com keyword local em cada página
- [ ] Schema markup `LocalBusiness` em JSON-LD:
  ```html
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Lagos Cleaning Services",
    "address": { "@type": "PostalAddress", "addressLocality": "Philadelphia", "addressRegion": "PA" },
    "telephone": "+1-XXX-XXX-XXXX",
    "url": "https://lagoscleaningpa.com",
    "serviceArea": ["Philadelphia PA", "South Jersey", "Delaware County PA"]
  }
  </script>
  ```
- [ ] Pedir review no Google para cada cliente após serviço completo (link direto do GMB)
- [ ] Criar perfil no **Yelp Business**, **Thumbtack**, **Angi** — backlinks gratuitos

---

## Decisão de Migração — Quando mover o formulário de cleaning para o novo domínio

**O backend NÃO muda.** Formulários no novo site continuam postando para:
```
https://lagosworld.app/api/cleaning/requests
```

Só adicione CORS no `api/index.js`:
```javascript
app.use(cors({ origin: ['https://lagosworld.app', 'https://lagoscleaningpa.com'] }));
```

---

## KPIs para medir sucesso (checar mensalmente)

| Métrica | Onde ver | Meta 90 dias |
|---|---|---|
| Impressões Google Maps | GMB Dashboard | 500+/mês |
| Cliques no GMB | GMB Dashboard | 50+/mês |
| Leads via formulário | Admin Panel → Cleaning tab | 20+/mês |
| Reviews Google | GMB perfil | 10+ reviews, 4.5★ |
| Posição search "cleaning Philadelphia" | Google Search Console | Top 20 |

---

## Custos estimados

| Item | Custo | Frequência |
|---|---|---|
| Domínio `lagoscleaningpa.com` | ~$12/ano | Anual |
| Vercel (já pago) | $0 extra | — |
| GMB | $0 | Gratuito |
| Google Search Console | $0 | Gratuito |
| Yelp/Thumbtack/Angi | $0 perfil básico | Gratuito |
| **Total fase 1** | **~$12** | — |
