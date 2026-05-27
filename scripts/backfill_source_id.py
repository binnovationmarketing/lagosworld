#!/usr/bin/env python3
"""
Backfill source_id on existing jewelry_products rows using SKU→source_id from catalog dump.
Uses PATCH requests per row — no SQL copy-paste errors.
"""
import json, os, time, urllib.request, urllib.parse, urllib.error

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

def patch_row(sku, source_id, retries=3):
    safe_sku = urllib.parse.quote(sku)
    url = f"{SUPABASE_URL}/rest/v1/jewelry_products?sku=eq.{safe_sku}&source_id=is.null"
    body = json.dumps({"source_id": source_id}).encode()
    for attempt in range(retries):
        req = urllib.request.Request(url, data=body, method="PATCH")
        req.add_header("Content-Type", "application/json")
        req.add_header("apikey", SUPABASE_KEY)
        req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
        req.add_header("Prefer", "return=minimal")
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return resp.status
        except urllib.error.HTTPError as e:
            raw = e.read()
            print(f"  ERROR {e.code} for SKU={sku}: {raw[:200]}")
            return e.code
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(2 ** attempt)  # backoff: 1s, 2s
            else:
                print(f"  TIMEOUT/ERROR for SKU={sku}: {e}")
                return 0

with open("scripts/catalog_dump.json", encoding="utf-8") as f:
    products = json.load(f)

sku_map = {p["sku"]: p["source_id"] for p in products if p.get("sku") and p.get("source_id")}
print(f"Backfilling {len(sku_map)} SKUs...")

ok = 0
for sku, sid in sku_map.items():
    status = patch_row(sku, sid)
    if status in (200, 204):
        ok += 1
    time.sleep(0.05)

print(f"\nDone: {ok}/{len(sku_map)} rows updated")
