-- Add notion_page_id column to articles table
-- This is used to deduplicate syncs from Notion publisheddb
-- Run this in the Supabase SQL editor once before using /api/sync-blogs

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS notion_page_id TEXT UNIQUE;
