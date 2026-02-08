-- Add cover_image column to articles table
-- This will store the URL of the cover image for each article

ALTER TABLE articles
ADD COLUMN IF NOT EXISTS cover_image TEXT;

COMMENT ON COLUMN articles.cover_image IS 'URL of the article cover image (from RSS media tags, Reddit thumbnails, etc.)';
