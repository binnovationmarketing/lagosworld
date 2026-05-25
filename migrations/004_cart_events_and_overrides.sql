-- Migration 004: Cart Events + Product Overrides
-- Run this in Supabase SQL Editor

-- ── Cart Events ──────────────────────────────────────────────────────────────
-- Tracks all cart interactions: add, abandon, purchase, view
-- Used for abandoned cart recovery email sequences

CREATE TABLE IF NOT EXISTS cart_events (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type     VARCHAR(50)  NOT NULL, -- 'add', 'cart_abandon', 'purchase', 'view'
  customer_name  VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  items          JSONB        NOT NULL DEFAULT '[]',
  total          DECIMAL(10,2) NOT NULL DEFAULT 0,
  extra_data     JSONB        NOT NULL DEFAULT '{}',
  occurred_at    TIMESTAMP,
  created_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cart_events_type     ON cart_events(event_type);
CREATE INDEX IF NOT EXISTS idx_cart_events_email    ON cart_events(customer_email) WHERE customer_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cart_events_occurred ON cart_events(occurred_at DESC);

-- ── Product Overrides ─────────────────────────────────────────────────────────
-- Stores admin overrides for product prices, images, description, video
-- product_id matches the numeric id in the PRODUCTS array in jewelry/index.html

CREATE TABLE IF NOT EXISTS product_overrides (
  id              UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id      BIGINT  UNIQUE NOT NULL,
  price_overrides JSONB   NOT NULL DEFAULT '{}', -- {"pid_vid": price, ...}
  description     TEXT,
  images          TEXT[]  NOT NULL DEFAULT '{}',
  video_url       TEXT,
  sort_order      INT,
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_overrides_pid ON product_overrides(product_id);

-- ── Abandoned Cart Recovery View ──────────────────────────────────────────────
-- Finds abandons from last 24h that have email and no purchase after
CREATE VIEW abandoned_carts AS
SELECT
  a.customer_email,
  a.customer_name,
  a.customer_phone,
  a.items,
  a.total,
  a.occurred_at AS abandoned_at
FROM cart_events a
WHERE
  a.event_type = 'cart_abandon'
  AND a.customer_email IS NOT NULL
  AND a.customer_email != ''
  AND a.occurred_at >= NOW() - INTERVAL '24 hours'
  AND NOT EXISTS (
    SELECT 1 FROM cart_events p
    WHERE p.event_type = 'purchase'
      AND p.customer_email = a.customer_email
      AND p.occurred_at > a.occurred_at
  )
ORDER BY a.occurred_at DESC;
