-- Migration 005: Add name column to product_overrides
-- Allows admin to override product display name from the admin panel

ALTER TABLE product_overrides
  ADD COLUMN IF NOT EXISTS name TEXT;
