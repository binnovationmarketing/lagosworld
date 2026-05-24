# Lagos World — Project Onboarding Context

> Load this file at the start of every new session to avoid re-discovering project context.
> Keep updated when new features are added.

---

## What This Project Is

**Lagos World** — multi-platform website for Dayane Lagos's PA/NJ business, built on:
- **Static HTML/CSS/JS** served from `public/`
- **Express API** in `api/` (serverless on Vercel)
- **Supabase** for database (orders, cleaning requests, professionals)
- **Nodemailer + Gmail** for transactional email

### Business Pillars (2 active)
1. **Lagos Jewelry** — 18k gold-plated semi-jewelry, 512 products, Philadelphia PA
2. **Lagos Cleaning** — Home/commercial cleaning service, PA & NJ markets

> Training and Estudio were removed from the site to improve ad campaign focus.

---

## File Map

| File | Purpose |
|------|---------|
| `public/index.html` | Home page — 2-pillar landing, branding |
| `public/jewelry/index.html` | Jewelry store — 11,979 lines, 512 hardcoded products |
| `public/cleaning/index.html` | Cleaning service landing + booking form |
| `public/admin/index.html` | Manager Panel — password: `lagos2025` |
| `public/js/products-data.js` | `window.PRODUCTS_ADMIN` — 512 products for admin, ~254KB |
| `api/index.js` | Express entry + `/api/send-order` handler |
| `api/routes/jewelry.js` | GET/POST `/api/jewelry/orders` |
| `api/routes/cleaning.js` | GET/POST `/api/cleaning/requests` |
| `api/routes/courses.js` | (Legacy — not used in active pages) |
| `api/services/email.js` | `sendEmail()` helper using nodemailer |

---

## Architecture Key Points

### Products — NOT in Supabase
Products are **hardcoded** in `public/jewelry/index.html` as a JS array (`PRODUCTS = [...]`).
Admin overrides are stored in **localStorage** on the manager's browser:
- `lj_prices` — price overrides by `{productId_variantId: price}`
- `lj_desc` — description overrides by `{productId: html}`
- `lj_imgs` — image overrides by `{productId: [url1, url2, ...]}`
- `lj_videos` — video URLs by `{productId: url}`
- `lj_manual_clients` — manually registered clients
- `lj_cart_events` — cart abandonment/purchase tracking events

These are read by `public/jewelry/index.html` at load time via:
```javascript
let priceOv  = JSON.parse(localStorage.getItem('lj_prices')||'{}');
let descOv   = JSON.parse(localStorage.getItem('lj_desc')  ||'{}');
let imgsOv   = JSON.parse(localStorage.getItem('lj_imgs')  ||'{}');
let videoOv  = JSON.parse(localStorage.getItem('lj_videos')||'{}');
```

### Orders — Saved to Supabase via send-order
The `/api/send-order` endpoint:
1. Sends email to admins (`binnovationmarketing@gmail.com`, `dayanelago22@gmail.com`)
2. Sends confirmation email to customer
3. **Also saves to Supabase `jewelry_orders` table** (non-blocking)

The `jewelry_orders` table needs these columns:
```sql
create table jewelry_orders (
  id uuid default gen_random_uuid() primary key,
  customer_name text,
  customer_email text,
  customer_phone text,
  delivery_method text,
  address text,
  items jsonb,
  total numeric,
  status text default 'pending',
  payment_method text,
  notes text,
  created_at timestamptz default now()
);
```

The `cleaning_requests` table:
```sql
create table cleaning_requests (
  id uuid default gen_random_uuid() primary key,
  customer_name text,
  customer_email text,
  customer_phone text,
  service_type text,
  employment_type text,
  address text,
  city text,
  description text,
  preferred_date text,
  estimated_hours text,
  status text default 'open',
  created_at timestamptz default now()
);
```

---

## Environment Variables (Vercel + local .env)

| Var | Purpose |
|-----|---------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase anon key |
| `EMAIL_USER` | Gmail address for sending |
| `EMAIL_PASS` | Gmail app password |

Never expose in client-side code.

---

## Admin Panel (`/admin`)

Password: `lagos2025`

### Tabs
- **Dashboard** — KPIs, revenue chart (Canvas), area bars, client strategy engine
- **Products** — 512-product grid, click to edit (description, prices, images, video)
- **Orders** — Fetches from `/api/jewelry/orders` (Supabase `jewelry_orders`)
- **Cleaning Leads** — Fetches from `/api/cleaning/requests`
- **Cart Activity** — Reads `lj_cart_events` from localStorage (populated by jewelry store)

### Features
- Drag-and-drop image reordering in product edit modal
- Manual client registration (saved to `lj_manual_clients` localStorage)
- Export/Import JSON backups of all overrides
- Client tier system: ELITE (≥$700), PREMIUM (≥$350), STANDARD (≥$160), NEW (<$160)

---

## Design System

```
Colors:
  --gold: #b8922e (gold accent)
  --gold-l: #d4a84c (gold hover)
  --black: #0a0a0a
  --dark: #111
  --dark2: #1a1a1a
  --text: #e4ddd0 (cream text)

Fonts:
  Cormorant Garamond — headings, logo, prices
  Montserrat — body, labels, buttons

Breakpoints: 768px (mobile), 600px, 380px
```

---

## Cart & Order Flow

1. User browses `public/jewelry/index.html`
2. Adds items → `addToCart()` → `updateCart()` → cart sidebar
3. Every cart event (add, abandon, purchase) → `trackCartEvent()` → `localStorage['lj_cart_events']`
4. Opens checkout → `openCheckout()` → form with ZIP lookup
5. ZIP entered → `lookupZip()` → `api.zippopotam.us` → autofills city/state
6. Submits order → `submitOrder()` → POST `/api/send-order` → email + Supabase save
7. WhatsApp message opens to `+12156262345`

---

## INP / Performance Notes

- `applyFilters()` — batched with requestAnimationFrame in 60-card chunks (512 cards)
- `.card` — has `content-visibility: auto; contain-intrinsic-size: auto 340px`
- Modal thumbnails — rendered via `requestAnimationFrame` to not block modal animation
- `addFromModal()` — `closeModal()` first, then `addToCart()` via `requestAnimationFrame`
- Touch listeners — passive: true

---

## API Endpoints

| Method | URL | Purpose |
|--------|-----|---------|
| POST | `/api/send-order` | Order email + Supabase save |
| GET | `/api/jewelry/orders` | List all orders (admin) |
| POST | `/api/jewelry/orders` | Create order (legacy) |
| GET | `/api/cleaning/requests` | List cleaning requests (admin) |
| POST | `/api/cleaning/requests` | Create cleaning request |
| POST | `/api/cleaning/professionals` | Register cleaning pro |
| GET | `/api/cleaning/professionals` | List approved pros |
| GET | `/api/health` | Health check |

---

## Email Configuration

Admin notifications go to both:
- `binnovationmarketing@gmail.com`
- `dayanelago22@gmail.com`

Subject format:
- Admin: `COMPRA REALIZADA LAGOS WORLD - {name}`
- Customer: `✝ Pedido Confirmado — Lagos Jewelry — {name}`

---

## Known Limitations / Future Work

- Products are hardcoded in HTML (not a CMS). Admin overrides are localStorage-only — they don't persist across devices.
- No geographic map yet (client concentration by area — area bars chart exists as proxy)
- No real-time market comparison yet
- PDF export not yet implemented (currently JSON only)
- Admin `lj_cart_events` is browser-local — cart events only visible on device where they occurred (would need API endpoint to centralize)
- The Supabase `jewelry_orders` table must be created manually (SQL above)
