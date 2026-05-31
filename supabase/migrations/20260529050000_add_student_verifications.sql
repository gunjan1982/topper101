-- Migration: Add student verifications table and storage setup

CREATE TABLE IF NOT EXISTS student_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrollment_number text NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('admit_card', 'id_card')),
  file_url text NOT NULL,
  status text NOT NULL DEFAULT 'verified' CHECK (status IN ('verified', 'pending', 'rejected')),
  raw_ocr_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT student_verifications_user_id_key UNIQUE (user_id),
  CONSTRAINT student_verifications_enrollment_number_key UNIQUE (enrollment_number)
);

-- Enable Row Level Security
ALTER TABLE student_verifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to keep it re-runnable/idempotent)
DROP POLICY IF EXISTS "Users can view their own verification record" ON student_verifications;
DROP POLICY IF EXISTS "Users can insert their own verification record" ON student_verifications;
DROP POLICY IF EXISTS "Users can update their own verification record" ON student_verifications;

-- Policies for student_verifications
CREATE POLICY "Users can view their own verification record"
  ON student_verifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verification record"
  ON student_verifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own verification record"
  ON student_verifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('admit_cards', 'admit_cards', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads to user folders" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to read their own admit cards" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own admit cards" ON storage.objects;

-- Storage policies for admit_cards bucket
CREATE POLICY "Allow authenticated uploads to user folders"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'admit_cards' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Allow users to read their own admit cards"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'admit_cards'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Allow users to delete their own admit cards"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'admit_cards'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
