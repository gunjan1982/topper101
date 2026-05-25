-- Add textbook_grounded flag to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS textbook_grounded boolean DEFAULT false;
