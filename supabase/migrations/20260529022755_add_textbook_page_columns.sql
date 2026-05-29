-- Add textbook_page and textbook_excerpt columns to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS textbook_page integer;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS textbook_excerpt text;
