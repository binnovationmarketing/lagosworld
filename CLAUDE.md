# Lagos World — AI Context

Read this before any task. No need to re-explain project structure each session.

---

## Stack

| Layer | Tech |
|-------|------|
| Hosting | Vercel (serverless) |
| Backend | Express.js — single entry `api/index.js` |
| DB | Supabase (Postgres) |
| Frontend | Vanilla JS — no framework |
| AI widget | Groq Llama 3.3 70B (Milla) + Gemini fallback |
| Email | Gmail SMTP via Nodemailer |
| Catalog | Conecta Venda API (Estação 79 Semijoias) |

---

## Domains

| Domain | Content |
|--------|---------|
| `lagosworld.app` | Lagos Jewelry shop + home page |
| `lagoscleaning.app` | Lagos Cleaning landing page (proxied from `/cleaning`) |
| `lagoscleaning.app/airbnb` | Airbnb turnover cleaning |
| `lagoscleaning.app/powerwashing` | CH ELITE Power Washing |

Middleware (`middleware.js`) routes by host — `lagoscleaning.app` → serves `/cleaning` content with clean URL.

---

## File Structure

```
api/index.js              ← ONLY serverless function (Vercel counts every .js in api/)
lib/
  routes/
    jewelry.js            ← orders, stock, overrides, catalog serve
    cleaning.js           ← cleaning + power wash booking
    courses.js            ← DEPRECATED (redirects to /jewelry)
    cron.js               ← emails, abandoned-carts, sync-catalog, invoice-stock
    admin.js              ← JWT auth, admin panel API
    milla.js              ← AI chat API
  services/
    email.js              ← nodemailer, sendEmail, sendOrderEmails, processDueEmails
    emailTemplates.js     ← jewelry email HTML
    cleaningEmailTemplates.js
    milla.js              ← Groq tool-calling logic
  middleware/
    auth.js               ← JWT sign/verify, requireAdmin
public/
  index.html              ← lagosworld.app home (Lagos Jewelry + story)
  jewelry/index.html      ← jewelry shop (monolith)
  cleaning/index.html     ← lagoscleaning.app main page
  airbnb/index.html       ← airbnb cleaning page (has dynamic photo gallery)
  powerwashing/index.html ← CH ELITE Power Washing (needs redesign)
  admin/index.html        ← admin panel SPA
  courses/index.html      ← REDIRECT to /jewelry
  js/
    products-data.js      ← GENERATED — 588 products from Supabase
    jewelry-filter.js     ← search (debounced 180ms), category filter, pagination
    jewelry-modal.js      ← product detail modal
    jewelry-cart.js       ← cart state
    jewelry-checkout.js   ← checkout flow
    jewelry-shipping.js   ← zip lookup, shipping calc
    jewelry-admin.js      ← admin product editor
    jewelry-ui.js         ← scroll animations, newsletter popup
    jewelry-state.js      ← shared state (curCat, curSearch, priceOv, etc.)
    jewelry-init.js       ← DOMContentLoaded, renderAllCards, stock overlays
  milla-widget.js         ← chat bubble, injected on all pages
scripts/
  sync-catalog-local.mjs  ← run locally to bypass Vercel 30s timeout (DO THIS instead of cron)
  import-invoice-000569.mjs ← first real invoice import (Pedido 000569)
vercel.json               ← cron schedules, rewrites, maxDuration: 120s
middleware.js             ← host-based routing (Edge)
```

---

## Business Lines

- **Lagos Jewelry** — retail semijewelry, catalog from Estação 79 (Conecta Venda supplier)
- **Lagos Cleaning** — residential/commercial cleaning booking (Philadelphia PA + NJ)
- **Airbnb Cleaning** — turnover + move-in/out service
- **CH ELITE Power Washing** — `lagoscleaning.app/powerwashing` (separate brand)
- **Milla** — AI sales assistant (chat widget on all pages)
- **Courses** — DEPRECATED, redirects to /jewelry

---

## Database — Supabase

**Project:** `vthtufcomuaiyeussrrj` (us-west-2)

Key tables:

| Table | Rows | Notes |
|-------|------|-------|
| `jewelry_products` | 588 | Full catalog. NEVER delete rows — only deactivate |
| `jewelry_orders` | 0 | Cleared for production |
| `order_items` | 0 | Cleared |
| `cleaning_requests` | 0 | Cleared |
| `cart_events` | 0 | Cleared |
| `email_queue` | 0 | Cleared |
| `newsletter_subscribers` | 0 | Cleared |
| `milla_conversations` | 1 | Has 1 stale test row — clean it |
| `zip_leads` | 0 | Cleared |
| `catalog_sync_log` | 1 | Last sync: 2026-05-29 |
| `stock_updates` | 0 | |
| `stock_deductions` | 0 | |
| `product_overrides` | 1 | |
| `cleaning_professionals` | 3 | Real data — keep |

`jewelry_products` schema (critical columns):
- `id` = `source_id` = `produto_id` from Conecta Venda (integer PK, no auto-sequence)
- `sku` = `produto_referencia` (INCONSISTENT: some `A 10046` with space, some `A10037` no space)
- `stock_qty` = real inventory (109 products have stock from Pedido 000569)
- `created_at` = when added to DB (used to detect "new" products)
- `variations` = JSONB `[{id, desc, price, stock, active, order}]`
- `images` = JSONB array of image URLs (577 on Conecta Venda CDN — NOT backed up)
- `img_primary`, `img_hover` = first two images

---

## Stock State (as of 2026-05-29)

- **109 products in stock** from Pedido 000569 (Estação 79, R$13,849.04, 155 units)
- **479 products** = order-only (stock_qty = 0)
- **44 new products** flagged `new_arrival=true` in DB → `newArrival:true` in products-data.js (drives ✦NEW badge + carousel)
- Rule: **NEVER delete products from DB** — only add or deactivate
- Stock deducted automatically on order confirmation via `/api/jewelry/orders`

Invoice import:
- **Script:** `scripts/import-invoice-000569.mjs`
- **Future invoices:** Run same pattern — reset all to 0, then SET qty from invoice (not ADD)
- **4 SKUs unmatched** from invoice: `A 514`, `CO 10079`, `CO 10080`, `P 10016` — not in DB yet

---

## Catalog Sync

```bash
# ALWAYS run locally (Vercel 30s limit; full sync takes 2-3 min)
node scripts/sync-catalog-local.mjs

# After sync, ALWAYS regenerate products-data.js:
node -e "
const BASE='https://vthtufcomuaiyeussrrj.supabase.co';
const KEY='<SUPABASE_SERVICE_KEY>';
// ... (see scripts/sync-catalog-local.mjs for full pattern)
"
```

**Catalog sync rules:**
- NEW products → INSERT with stock from `variacao_estoque`
- EXISTING SKUs → UPDATE catalog fields, PRESERVE `stock_qty`
- SKU = permanent identifier, never changes
- After sync: regenerate `public/js/products-data.js`

**Conecta Venda API:**
```
Base:  https://dados.conectavenda.com.br/api
Token: 2441f464b56e9641d86b2772287d13d5

POST /api/cliente/iniciar  (get session token)
POST /api/produtos/listar  (paginated, up to 10 pages × 577 items)
```

---

## products-data.js — CRITICAL

**File:** `public/js/products-data.js`
**Current count:** 588 products (in sync with DB as of 2026-05-29)
**Must regenerate after:** every catalog sync, every manual DB change

Quick regenerate (use the committed script — do NOT hand-roll the inline snippet):
```bash
export SUPABASE_URL="https://vthtufcomuaiyeussrrj.supabase.co"
export SUPABASE_SERVICE_KEY="<service_role key>"   # never commit this
node scripts/regen-products-data.mjs
```

**CRITICAL field mapping** (frontend depends on these exact names):
- `newArrival` ← DB `new_arrival` — drives ✦NEW badge + "Novidades" carousel.
  Frontend reads `p.newArrival`. The old inline snippet emitted `isNew` from
  `created_at` instead → carousel + badges silently empty. Do not regress.
- `stock` ← `stock_qty` — drives "In Stock" badge.
- `featured` ← `featured` — carried through, not yet consumed by any frontend.

---

## Environment Variables

| Var | Used for | Status |
|-----|----------|--------|
| `SUPABASE_URL` | Supabase project URL | ✅ Set on Vercel |
| `SUPABASE_SERVICE_KEY` | Backend (bypasses RLS) | ✅ Set on Vercel |
| `JWT_SECRET` | Admin JWT signing | ✅ Set on Vercel |
| `ADMIN_PASSWORD` | Admin login | ✅ Set on Vercel |
| `CRON_SECRET` | Protects /api/cron/* | ❌ NOT SET — security gap |
| `EMAIL_USER` | Gmail SMTP sender | ✅ Set on Vercel (local .env has placeholder) |
| `EMAIL_PASS` | Gmail App Password | ✅ Set on Vercel (local .env has placeholder) |
| `GROQ_API_KEY` | Milla AI | ✅ Set on Vercel |
| `GEMINI_API_KEY` | Milla fallback | ✅ Set on Vercel |
| `MILLA_EMAIL_USER` | Milla emails | ✅ Set on Vercel |
| `MILLA_EMAIL_PASS` | Milla Gmail | ✅ Set on Vercel |
| `GOOGLE_CALENDAR_CREDENTIALS` | Calendar booking | ✅ Set — untested |

---

## Cron Jobs (Vercel)

| Schedule | Path | What |
|----------|------|------|
| `0 13 * * *` | `/api/cron/emails` | Send scheduled jewelry emails |
| `0 17 * * *` | `/api/cron/abandoned-carts` | Abandoned cart recovery emails |
| `0 9 * * 1` | `/api/cron/sync-catalog` | Pull new products (Monday 9am ET) |

⚠️ `CRON_SECRET` not set → endpoints unprotected. Set immediately.

---

## INP Fixes Applied (2026-05-29)

All INP issues on jewelry page fixed:
- `#search` input: removed `oninput`, added 180ms debounced passive listener
- `renderShopPage`: delta-only classList toggle (≤40 ops instead of 588)
- All cards start with `.hidden` class; only current 20 revealed
- `keydown` on document: uses `_modalOpen` flag instead of `classList.contains()`
- `_modalOpen` set by `openModal()` / `closeModal()` in jewelry-modal.js
- Nav scroll: rAF + passive listener (cleaning page)
- ZIP input: passive listener (cleaning page)

---

## Security Rules — IMMUTABLE

- **NEVER** `git reset --hard` / `git checkout -- .` / `git clean -fd`
- **NEVER** promote to production without explicit approval from Henrique
- `ADMIN_PASSWORD` only in env var — never in client-side HTML
- `JWT_SECRET` never shared or logged
- Gmail SMTP requires App Password (16 chars, 2FA) — NOT regular password
- Supabase `service_role` key backend only — never expose to browser
- **NEVER delete products from `jewelry_products`** — only set `active=false`

---

## Pending Tasks — PRIORITY ORDER

### 🔴 CRITICAL (security + data safety)

1. **Set `CRON_SECRET` on Vercel** — `vercel env add CRON_SECRET` — cron endpoints currently unprotected
2. **Enable RLS** on 4 tables: `email_queue`, `catalog_sync_log`, `stock_updates`, `stock_deductions`
3. **Image backup script** — download all 577 Conecta Venda CDN images → upload to Supabase Storage. If CDN goes down, all product photos break. Only 11 of 588 are backed up.
4. **Auto-rebuild products-data.js** — add to `npm run build` so catalog syncs automatically show on site

### 🟠 HIGH (features blocking launch)

5. **SKU normalization** — DB has mixed format (`A 10046` vs `A10037`). Fix: add space consistently after letter prefix. Affects invoice imports.
6. **Two product views on jewelry page:**
   - View 1: All 588 catalog products (current)
   - View 2: Only 109 in-stock products
   - Toggle button in UI
7. **Manual stock entry by SKU** — admin can type SKU → add to in-stock view
8. ✅ DONE — "NEW" badge + "Novidades" carousel now render (44 products). Fixed field-name bug (`isNew`→`newArrival`) via `scripts/regen-products-data.mjs`.
9. **"Order Only" label** — 479 products with `stock: 0` should show "Available to Order" badge

### 🟡 MEDIUM (UX improvements)

10. **CH ELITE Power Washing page** — `/powerwashing` needs full redesign. Assets in: `public/powerwashing/CH ELITE WASHING/` (logos: COBRE, MARROM, branco; Gemini images; MP4 video)
11. **Bilingual toggle EN/PT** — both sites. English primary, Portuguese optional. JS object approach, no framework.
12. **Lagos Cleaning logo** — user has transparent embroidered PNG. Need file path to apply.
13. **Admin panel: stock column + manual stock edit** — currently no stock visibility in admin
14. **Admin panel: "Rebuild Catalog" button** — trigger products-data.js regeneration

### 🟢 LOW (cleanup)

15. Clean `milla_conversations` table (1 stale test row)
16. Fix duplicate SKU: `P 10054` and `P10054` both in DB — same product
17. Delete root-level dev files: `admin.html`, `admin.js`, `api.js`, `app.js`, `database.js`, `index.html`, `lagos_jewelry_catalog.html`, `patch-*.js`, `produtos_raw.json`
18. Remove `lib/routes/courses.js` (deprecated)
19. Check `public/calendar/index.html` — still needed?
20. Remove unused Vercel env vars: `NEXT_PUBLIC_*`, `POSTGRES_*`

---

## Admin Panel

- **URL:** `/admin` — JWT login (`ADMIN_PASSWORD` env var)
- **File:** `public/admin/index.html`
- Tab IDs: `tab-dashboard`, `tab-products`, `tab-orders`, `tab-cleaning`, `tab-templates`, `tab-agenda`, `tab-calendario`
- Stock tracking: `stockOv` → `localStorage('lj_stock')`, threshold `< 3` for Low Stock

---

## Email — Critical Pattern (Vercel serverless)

```javascript
// ALWAYS await email BEFORE res.json() — Vercel freezes function after response
await sendCleaningConfirmation(...);
res.json({ success: true });

// NEVER use pool:true — causes infinite hang in serverless
// createTransport({ pool: false }) or recreate per call
```

---

## Cleaning Route — Validated service_type values

```javascript
'house_exterior','driveway_sidewalk','deck_patio','roof_softwash',
'commercial','gutter_cleaning','multiple',
'house','apartment','movein','onetime','office',
'power_deck','power_patio','power_siding','power_full',
'residential','power_washing'
```

---

## Milla — Anti-Hallucination Rules

- ONLY use SKUs returned by `search_jewelry` tool — never invent
- Real SKU format: `CO 764`, `B2437`, `A 628` — NOT `BE002`, `CE001`
- DB has 588 products; `products-data.js` has 588 (synced 2026-05-29)
- If search < 3 results → recommend only those, do NOT fill gaps

---

## Known Technical Debt

| Item | File | Impact |
|------|------|--------|
| Monolith HTML | `public/jewelry/index.html` | Hard to maintain |
| Static product file | `public/js/products-data.js` (448KB+) | Slow load, manual regen |
| 577 CDN images | DB `img_primary`/`images` fields | Single point of failure |
| SKU format inconsistency | `jewelry_products.sku` | Invoice import mismatches |
| No CRON_SECRET | Vercel env | Security gap |
| RLS missing on 4 tables | Supabase | Data exposure |
| Newsletter route inline | `api/index.js` | Should move to `lib/routes/` |

---

## Deploy

```bash
cd "/Users/rique_energy/Documents/Negocios/Lagos Cleaning"
export PATH="$HOME/.npm-global/bin:$PATH"
vercel --prod --yes
```

Git remote: Vercel Git integration auto-deploys on push to `main`.
