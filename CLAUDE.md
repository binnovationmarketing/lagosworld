# Lagos World — AI Context

Read this before any task. No need to re-explain project structure each session.

---

## Stack

| Layer | Tech |
|-------|------|
| Hosting | Vercel Hobby (1 serverless function limit) |
| Backend | Express.js — single entry `api/index.js` |
| DB | Supabase (Postgres + RLS) |
| Frontend | Vanilla JS — no framework |
| AI widget | Groq Llama 3.3 70B (Milla) |
| Email | Gmail SMTP via Nodemailer |
| Catalog | Conecta Venda API (Estação 79) |

---

## File Structure

```
api/index.js              ← ONLY serverless function (Vercel counts every .js in api/)
lib/
  routes/                 ← all Express routers (require'd by api/index.js)
    jewelry.js
    cleaning.js
    courses.js
    cron.js               ← /api/cron/emails, /api/cron/abandoned-carts, /api/cron/sync-catalog
    admin.js
    milla.js
  services/
    email.js              ← nodemailer, sendEmail, sendOrderEmails, processDueEmails
    emailTemplates.js     ← jewelry email HTML
    cleaningEmailTemplates.js
    milla.js              ← Groq tool-calling logic
  middleware/
    auth.js               ← JWT sign/verify, requireAdmin
public/
  jewelry/index.html      ← ~12k lines vanilla JS+HTML (monolith, known debt)
  js/
    products-data.js      ← GENERATED — run scripts/regen_products_data.py to rebuild
  milla-widget.js         ← chat bubble injected on all pages
scripts/
  regen_products_data.py  ← fetch all Supabase products → rebuild products-data.js
  scrape_catalog.py       ← manual sync from Conecta Venda API
vercel.json               ← cron schedules, rewrites
```

---

## Business Lines

- **Lagos Jewelry** — retail jewelry store, catalog from Estação 79 (Conecta Venda supplier)
- **Lagos Cleaning** — residential/commercial cleaning booking
- **Cursos** — online courses platform
- **Milla** — AI sales assistant (chat widget on jewelry page)

---

## Database — Supabase

Key tables: `jewelry_products`, `jewelry_orders`, `newsletter_subscribers`,
`cleaning_requests`, `abandoned_carts`, `scheduled_emails`

`jewelry_products` schema (relevant columns):
- `id` = `source_id` = `produto_id` from Conecta Venda (no sequence, supplier ID used directly)
- `sku` = `produto_referencia`
- `variations` = JSONB array `[{id, desc, price, stock, active, order}]`
- `source_id` = used by sync-catalog cron to detect new products

---

## Environment Variables

| Var | Used for |
|-----|----------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Backend Supabase client (bypasses RLS) |
| `JWT_SECRET` | Admin JWT signing |
| `ADMIN_PASSWORD` | Admin login (NEVER in client HTML) |
| `CRON_SECRET` | Protects /api/cron/* endpoints |
| `EMAIL_USER` | Gmail SMTP sender |
| `EMAIL_PASS` | Gmail App Password (16 chars, 2FA required — NOT regular password) |
| `GROQ_API_KEY` | Milla AI (Groq Llama 3.3 70B) |
| `MILLA_EMAIL_USER` | Milla confirmation emails sender |
| `MILLA_EMAIL_PASS` | Milla Gmail App Password |

---

## Cron Jobs (Vercel)

| Schedule | Path | What |
|----------|------|------|
| `0 13 * * *` | `/api/cron/emails` | Send scheduled jewelry emails |
| `0 17 * * *` | `/api/cron/abandoned-carts` | Abandoned cart recovery emails |
| `0 9 * * *` | `/api/cron/sync-catalog` | Pull new products from Conecta Venda |

Protected by `Authorization: Bearer $CRON_SECRET` header.

---

## Conecta Venda API

```
Base:    https://dados.conectavenda.com.br/api
Token:   2441f464b56e9641d86b2772287d13d5

# Init session
POST /api/cliente/iniciar
Headers: conecta-session: ""
Body:    {"catalogo": "<token>"}
→ Response header: conecta-session: <session-token>

# Fetch catalog (returns ALL ~548 products regardless of pagination)
POST /api/produtos/listar
Headers: conecta-session: <session-token>
Body:    {"catalogo": "<token>", "pagina": 1, "limite": 1000}
```

After syncing new products to Supabase, regenerate static file:
```bash
SUPABASE_URL=... SUPABASE_SERVICE_KEY=... python3 scripts/regen_products_data.py
```

---

## Security Rules — IMMUTABLE

- **NEVER** `git reset --hard` / `git checkout -- .` / `git clean -fd`
- **NEVER** promote to production without explicit approval from Henrique
- `ADMIN_PASSWORD` only in env var — never in client-side HTML
- `JWT_SECRET` never shared or logged
- Gmail SMTP requires App Password (16 chars) — never use regular password
- Supabase: `service_role` key backend only — never expose to browser
- `CRON_SECRET` protects all `/api/cron/*` endpoints

---

## Known Technical Debt

| Item | File | Impact |
|------|------|--------|
| Monolith HTML | `public/jewelry/index.html` (~12k lines) | Hard to maintain/edit |
| Static product file | `public/js/products-data.js` (448KB) | Slow page load, manual regen needed |
| Newsletter route inline | `api/index.js` | Should move to `lib/routes/newsletter.js` |
| Milla tool-calling unstable | Groq Llama 3.3 70B | Consider claude-3-5-haiku (~$0.003/conv) |
| `CJ 10045` price $0.00 | jewelry_products | No variations priced in supplier catalog |

---

## Common Commands

```bash
# Regenerate products-data.js after catalog sync
SUPABASE_URL=<url> SUPABASE_SERVICE_KEY=<key> python3 scripts/regen_products_data.py

# Manual catalog sync (dry-run)
SUPABASE_URL=<url> SUPABASE_SERVICE_KEY=<key> python3 scripts/scrape_catalog.py

# Manual catalog sync (insert new only)
SUPABASE_URL=<url> SUPABASE_SERVICE_KEY=<key> python3 scripts/scrape_catalog.py --insert

# Trigger cron manually (local)
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/sync-catalog
```

---

## AI Prompt Pattern (for this project)

```
CONTEXT: [read CLAUDE.md]
FILE: lib/routes/jewelry.js:142
PROBLEM: <exact error message>
CONSTRAINT: Vercel Hobby — 1 function, no new files in api/
OUTPUT: minimal diff, do not rewrite whole file
```
