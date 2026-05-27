#!/usr/bin/env python3
"""
Regenerate public/js/products-data.js from Supabase jewelry_products.
Fetches all rows, maps to frontend format, writes window.PRODUCTS = [...].
"""
import json, os, urllib.request, urllib.parse

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
OUTPUT = os.path.join(os.path.dirname(__file__), "..", "public", "js", "products-data.js")

def fetch_all():
    all_rows = []
    offset = 0
    page = 1000
    while True:
        url = (f"{SUPABASE_URL}/rest/v1/jewelry_products"
               f"?select=id,sku,name,description,category,images,img_primary,img_hover,min_price,max_price,variations,active"
               f"&order=id.asc"
               f"&limit={page}&offset={offset}")
        req = urllib.request.Request(url)
        req.add_header("apikey", SUPABASE_KEY)
        req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
        with urllib.request.urlopen(req, timeout=30) as resp:
            batch = json.load(resp)
        all_rows.extend(batch)
        if len(batch) < page:
            break
        offset += page
    return all_rows

def transform(row):
    imgs = row.get("images") or []
    if isinstance(imgs, str):
        try: imgs = json.loads(imgs)
        except: imgs = [imgs]
    img1 = row.get("img_primary") or (imgs[0] if imgs else "")
    img2 = row.get("img_hover") or (imgs[1] if len(imgs) > 1 else img1)

    variations_raw = row.get("variations") or []
    if isinstance(variations_raw, str):
        try: variations_raw = json.loads(variations_raw)
        except: variations_raw = []

    variacoes = []
    for v in variations_raw:
        price = v.get("price") or 0
        variacoes.append({
            "id":       v.get("id"),
            "desc":     v.get("desc") or "",
            "price":    price,
            "original": price
        })

    return {
        "id":       row["id"],
        "name":     row.get("name") or "",
        "sku":      row.get("sku") or "",
        "cat":      row.get("category") or "OUTROS",
        "imgs":     imgs,
        "img":      img1,
        "img2":     img2,
        "minPrice": row.get("min_price") or 0,
        "maxPrice": row.get("max_price") or 0,
        "variacoes": variacoes,
        "descricao": row.get("description") or ""
    }

print("Fetching from Supabase...")
rows = fetch_all()
print(f"Got {len(rows)} rows")

# Only active products
active = [r for r in rows if r.get("active") is not False]
print(f"Active: {len(active)}")

products = [transform(r) for r in active]

out_path = os.path.abspath(OUTPUT)
with open(out_path, "w", encoding="utf-8") as f:
    f.write("/* Lagos Jewelry — Full Product Data (shared by /jewelry and /admin) */\n")
    f.write("window.PRODUCTS = ")
    json.dump(products, f, ensure_ascii=False, separators=(",", ":"))
    f.write(";\n")

size_kb = os.path.getsize(out_path) / 1024
print(f"Written: {out_path} ({size_kb:.0f}KB, {len(products)} products)")
