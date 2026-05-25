-- Migration 006: Milla autonomous agent conversation history
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS milla_conversations (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     TEXT        NOT NULL UNIQUE,
  channel        TEXT        NOT NULL DEFAULT 'web',   -- 'web', 'sms', 'whatsapp'
  customer_name  TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  intent         TEXT,                                 -- 'jewelry', 'cleaning', 'power_washing', 'general'
  status         TEXT        NOT NULL DEFAULT 'active', -- 'active', 'booked', 'closed'
  messages       JSONB       NOT NULL DEFAULT '[]',    -- full Claude message history
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for admin queries
CREATE INDEX IF NOT EXISTS milla_conversations_status_idx ON milla_conversations(status);
CREATE INDEX IF NOT EXISTS milla_conversations_intent_idx ON milla_conversations(intent);
CREATE INDEX IF NOT EXISTS milla_conversations_created_idx ON milla_conversations(created_at DESC);

-- RLS: backend only (service_role bypasses RLS)
ALTER TABLE milla_conversations ENABLE ROW LEVEL SECURITY;

-- No public access — all reads/writes via service_role key in API
CREATE POLICY "service_role_only" ON milla_conversations
  USING (auth.role() = 'service_role');
