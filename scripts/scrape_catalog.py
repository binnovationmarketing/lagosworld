#!/usr/bin/env python3
"""
Conecta Venda catalog scraper — Estação 79
Fetches all products, compares with Supabase, inserts new ones.

Usage:
  python3 scripts/scrape_catalog.py               # scrape + show diff
  python3 scripts/scrape_catalog.py --insert       # scrape + insert new to Supabase
  python3 scripts/scrape_catalog.py --full-sync    # upsert everything (update prices/stock)
"""

import sys
import json
import time
import argparse
import os
import re
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime, timezone

# ── Config ────────────────────────────────────────────────────────────────────

CATALOG_TOKEN = "2441f464b56e9641d86b2772287d13d5"
API_BASE      = "https://dados.conectavenda.com.br/api"
PAGE_SIZE     = 100   # items per page

# Supabase — read from env (same vars used by the Node.js app)
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

# ── HTTP helpers ──────────────────────────────────────────────────────────────

def http_post(url, data, headers=None):
    body = json.dumps(data).encode("utf-8")
    req  = urllib.request.Request(url, data=body, method="POST")
    req.add_header("Content-Type", "application/json")
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw  = resp.read()
            hdrs = dict(resp.headers)
            if not raw.strip():
                return {}, hdrs   # 201 return=minimal → empty body is fine
            return json.loads(raw.decode("utf-8", errors="replace")), hdrs
    except urllib.error.HTTPError as e:
        raw = e.read()
        raise RuntimeError(f"HTTP {e.code}: {raw[:400]}")

def http_get(url, headers=None):
    req = urllib.request.Request(url)
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    with urllib.request.urlopen(req, timeout=30) as resp:
        raw = resp.read()
        return json.loads(raw.decode("utf-8", errors="replace")), dict(resp.headers)

# ── Session ───────────────────────────────────────────────────────────────────

def init_session():
    """POST /cliente/iniciar — returns session token."""
    data, headers = http_post(f"{API_BASE}/cliente/iniciar", {"catalogo": CATALOG_TOKEN})
    session = headers.get("conecta-session") or headers.get("Conecta-Session", "")
    if not session:
        raise RuntimeError(f"No session token in response headers. Response: {str(data)[:200]}")
    print(f"[✓] Session started: {session[:20]}...")
    return session

# ── Scraping ──────────────────────────────────────────────────────────────────

def fetch_page(session, page):
    data, _ = http_post(
        f"{API_BASE}/produtos/listar",
        {"catalogo": CATALOG_TOKEN, "pagina": page, "limite": PAGE_SIZE},
        {"conecta-session": session}
    )
    if isinstance(data, dict) and "erro" in data:
        raise RuntimeError(f"API error: {data}")
    return data if isinstance(data, list) else []

def scrape_all_products():
    """Fetch every product from the catalog.

    The Conecta Venda API returns the FULL catalog in a single call
    regardless of pagination params (tested: same 547 products on every page).
    We do one call, deduplicate by produto_id, and return.
    """
    session = init_session()
    print(f"  Fetching full catalog...", end="", flush=True)
    items = fetch_page(session, page=1)
    print(f" {len(items)} products")

    # Deduplicate by produto_id (safety net)
    seen = {}
    for p in items:
        pid = p.get("produto_id")
        if pid and pid not in seen:
            seen[pid] = p
    unique = list(seen.values())

    if len(unique) < len(items):
        print(f"  (deduplicated {len(items) - len(unique)} duplicates → {len(unique)} unique)")

    print(f"\n[✓] Total from catalog: {len(unique)} products")
    return unique

# ── Transform ─────────────────────────────────────────────────────────────────

def clean_html(html):
    """Strip HTML tags, return plain text."""
    if not html:
        return ""
    return re.sub(r"<[^>]+>", "", html).strip()

def map_category(group_desc):
    """Map Estação 79 group names to our canonical categories."""
    g = (group_desc or "").upper()
    mapping = {
        "BRINCO":    "BRINCOS",
        "ANEL":      "ANÉIS",
        "COLAR":     "COLARES",
        "CORRENTE":  "COLARES",
        "GARGANTILHA": "COLARES",
        "PULSEIRA":  "PULSEIRAS E BRACELETES",
        "BRACELETE": "PULSEIRAS E BRACELETES",
        "CONJUNTO":  "CONJUNTOS",
        "PINGENTE":  "PINGENTES",
        "ACESSORIO": "ACESSÓRIOS",
        "ACO":       "AÇO",
    }
    for key, cat in mapping.items():
        if key in g:
            return cat
    return group_desc or "OUTROS"

def transform_product(raw):
    """Convert raw API product to jewelry_products DB schema.

    DB columns: id, name, sku, category, category_raw, images, img_primary,
                img_hover, min_price, max_price, variations, description,
                active, featured, sort_order, created_at, updated_at, source_id
    """
    variations = []
    min_price = None
    max_price = None

    for v in (raw.get("produto_variacoes") or []):
        price_cents = v.get("variacao_preco") or 0
        price_usd   = round(price_cents / 100, 2)  # centavos → USD (site sells in USD)

        if price_usd > 0:
            if min_price is None or price_usd < min_price:
                min_price = price_usd
            if max_price is None or price_usd > max_price:
                max_price = price_usd

        variations.append({
            "id":    v.get("variacao_id"),
            "desc":  v.get("variacao_descricao", ""),
            "price": price_usd,
            "stock": v.get("variacao_estoque"),
            "active": bool(v.get("variacao_ativo", 1)),
            "order": v.get("variacao_ordem", 0),
        })

    images = raw.get("produto_imagens") or []

    return {
        # ── Core identity ──
        # id = produto_id (existing convention — conectavenda ID is PK)
        "id":           raw.get("produto_id"),
        "source_id":    raw.get("produto_id"),            # also stored in source_id for sync queries
        "sku":          raw.get("produto_referencia", "").strip(),
        "name":         raw.get("produto_nome", "").strip(),
        "description":  clean_html(raw.get("produto_descricao", "")),
        # ── Category ──
        "category":     map_category(raw.get("produto_grupo_descricao")),
        "category_raw": raw.get("produto_grupo_descricao", ""),
        # ── Images ──
        "images":       images,
        "img_primary":  images[0] if len(images) > 0 else "",
        "img_hover":    images[1] if len(images) > 1 else (images[0] if images else ""),
        # ── Pricing ──
        "min_price":    min_price or 0,
        "max_price":    max_price or 0,
        # ── Variations ──
        "variations":   variations,
        # ── Flags ──
        "active":       bool(raw.get("produto_ativo", 1)),
        "featured":     bool(raw.get("produto_tag_destaque")),
        "sort_order":   0,
        # ── Timestamps ──
        "updated_at":   datetime.now(timezone.utc).isoformat(),
    }

# ── Supabase ──────────────────────────────────────────────────────────────────

def supabase_get(path, params=""):
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("SUPABASE_URL or SUPABASE_SERVICE_KEY not set")
    url = f"{SUPABASE_URL}/rest/v1/{path}{params}"
    data, _ = http_get(url, {
        "apikey":        SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Prefer":        "count=exact",
    })
    return data

def supabase_post(path, body, prefer="return=minimal"):
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("SUPABASE_URL or SUPABASE_SERVICE_KEY not set")
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    data, _ = http_post(url, body, {
        "apikey":        SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Prefer":        prefer,
    })
    return data

def supabase_upsert(path, body):
    """Upsert via POST with resolution=merge-duplicates (on_conflict=source_id)."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("SUPABASE_URL or SUPABASE_SERVICE_KEY not set")
    url = f"{SUPABASE_URL}/rest/v1/{path}?on_conflict=source_id"
    data, _ = http_post(url, body, {
        "apikey":        SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Prefer":        "return=minimal,resolution=merge-duplicates",
    })
    return data

def get_existing_skus():
    """Return set of SKUs already in jewelry_products."""
    rows = supabase_get("jewelry_products", "?select=sku,source_id&limit=2000")
    return {r["sku"] for r in rows if r.get("sku")}

# ── Main ──────────────────────────────────────────────────────────────────────

def run(args):
    print(f"\n{'='*60}")
    print(f"  Lagos Jewelry — Catalog Sync")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}\n")

    # 1. Scrape
    raw_products  = scrape_all_products()
    transformed   = [transform_product(p) for p in raw_products]
    catalog_count = len(transformed)

    # Stats
    active = sum(1 for p in transformed if p["active"])
    cats   = {}
    for p in transformed:
        cats[p["category"]] = cats.get(p["category"], 0) + 1

    print(f"\n── Catalog breakdown ──────────────────────────────────")
    print(f"  Total products : {catalog_count}")
    print(f"  Active         : {active}")
    for cat, count in sorted(cats.items(), key=lambda x: -x[1]):
        print(f"  {cat:<35} {count}")

    # 2. Compare with DB
    if args.insert or args.full_sync:
        print(f"\n── Comparing with Supabase ────────────────────────────")
        existing_skus = get_existing_skus()
        print(f"  DB currently   : {len(existing_skus)} products (matched by SKU)")

        new_products     = [p for p in transformed if p["sku"] not in existing_skus]
        updated_products = [p for p in transformed if p["sku"] in existing_skus]

        print(f"  New (to insert): {len(new_products)}")
        print(f"  Existing       : {len(updated_products)}")

        if new_products:
            print(f"\n── New products ───────────────────────────────────────")
            for p in new_products[:20]:
                print(f"  [{p['sku']:<10}] {p['name'][:45]:<45} {p['category']}")
            if len(new_products) > 20:
                print(f"  ... and {len(new_products) - 20} more")

        # 3. Insert / upsert
        if args.insert and new_products:
            print(f"\n── Inserting {len(new_products)} new products ──────────────────")
            # Batch in chunks of 50
            inserted = 0
            for i in range(0, len(new_products), 50):
                chunk = new_products[i:i+50]
                supabase_post("jewelry_products", chunk, "return=minimal")
                inserted += len(chunk)
                print(f"  Inserted {inserted}/{len(new_products)}...")
                time.sleep(0.2)
            print(f"[✓] Inserted {inserted} new products")

        if args.full_sync and transformed:
            # full-sync only works on products that already have source_id set
            syncable = [p for p in transformed if p.get("source_id")]
            print(f"\n── Full upsert: {len(syncable)} products ─────────────────")
            upserted = 0
            for i in range(0, len(syncable), 50):
                chunk = syncable[i:i+50]
                supabase_upsert("jewelry_products", chunk)
                upserted += len(chunk)
                print(f"  Upserted {upserted}/{len(syncable)}...")
                time.sleep(0.2)
            print(f"[✓] Upserted {upserted} products")

    else:
        # Dry run — just show what we found
        print(f"\n── Dry run (no DB changes) ────────────────────────────")
        print(f"  Pass --insert to add new products to Supabase")
        print(f"  Pass --full-sync to upsert everything (prices+stock)")
        print(f"\n  First 10 products:")
        for p in transformed[:10]:
            vcount = len(p["variations"])
            prange = f"${p['min_price']:.2f}" + (f"–${p['max_price']:.2f}" if p['max_price'] != p['min_price'] else "")
            print(f"  [{p['sku']:<10}] {p['name'][:40]:<40} {prange:<15} ({vcount}v) [{p['category']}]")

    # 4. Save JSON dump regardless
    out_path = "scripts/catalog_dump.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(transformed, f, ensure_ascii=False, indent=2)
    print(f"\n[✓] Full catalog saved to {out_path}")
    print(f"    ({catalog_count} products, {os.path.getsize(out_path)//1024}KB)\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scrape Estação 79 catalog")
    parser.add_argument("--insert",    action="store_true", help="Insert new products to Supabase")
    parser.add_argument("--full-sync", action="store_true", help="Upsert all products (prices+stock)")
    args = parser.parse_args()
    run(args)
