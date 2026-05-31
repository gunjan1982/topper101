-- Migration: Add credit system columns to users table

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS credits integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_clicks integer NOT NULL DEFAULT 0;
