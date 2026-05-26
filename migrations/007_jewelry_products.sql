-- ============================================================
-- 007_jewelry_products.sql
-- Lagos Jewelry — Product catalog table
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS jewelry_products (
  id            BIGINT PRIMARY KEY,          -- original product ID from source
  name          TEXT    NOT NULL,
  sku           TEXT,
  category      TEXT    NOT NULL,
  images        JSONB   NOT NULL DEFAULT '[]',  -- array of image URLs
  img_primary   TEXT,                           -- first image (shortcut)
  img_hover     TEXT,                           -- second image for hover
  min_price     NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_price     NUMERIC(10,2) NOT NULL DEFAULT 0,
  variations    JSONB   NOT NULL DEFAULT '[]',  -- [{id, desc, price, original}]
  description   TEXT,                           -- HTML description from source
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  featured      BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_jewelry_products_category  ON jewelry_products (category) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_jewelry_products_active     ON jewelry_products (active);
CREATE INDEX IF NOT EXISTS idx_jewelry_products_featured   ON jewelry_products (featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_jewelry_products_price      ON jewelry_products (min_price);
CREATE INDEX IF NOT EXISTS idx_jewelry_products_name       ON jewelry_products USING gin(to_tsvector('english', name));

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_jewelry_products_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_jewelry_products_updated ON jewelry_products;
CREATE TRIGGER trg_jewelry_products_updated
  BEFORE UPDATE ON jewelry_products
  FOR EACH ROW EXECUTE FUNCTION update_jewelry_products_timestamp();

-- RLS: public read, service_role write
ALTER TABLE jewelry_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active products"
  ON jewelry_products FOR SELECT
  USING (active = TRUE);

CREATE POLICY "Service role full access"
  ON jewelry_products FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE jewelry_products IS 'Lagos Jewelry product catalog — 512 products migrated from static JS';
