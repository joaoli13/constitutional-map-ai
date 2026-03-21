-- Migration v2: add focused_segment_id column to shared_views
-- Run once: psql $NEON_DATABASE_URL -f scripts/migrate-shared-views-v2.sql

ALTER TABLE shared_views ADD COLUMN IF NOT EXISTS focused_segment_id text;
