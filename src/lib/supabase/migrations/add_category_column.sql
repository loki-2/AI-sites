-- Add category column to articles table
-- Run this in Supabase SQL Editor

ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS category VARCHAR(20) CHECK (category IN ('news', 'actionable'));

-- Add comment for documentation
COMMENT ON COLUMN articles.category IS 'Article classification: news (announcements, launches) or actionable (tutorials, guides)';
