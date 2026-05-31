-- Migration: Automated referral rewards at signup
-- Trigger on public.users after insert to credit both referrer and referee

CREATE OR REPLACE FUNCTION handle_public_user_inserted()
RETURNS trigger AS $$
DECLARE
  referrer_id uuid;
BEGIN
  -- If referred_by is set, reward both referrer and referee
  IF NEW.referred_by IS NOT NULL AND NEW.referred_by <> '' THEN
    -- Find referrer by referral_code
    SELECT id INTO referrer_id FROM public.users WHERE referral_code = NEW.referred_by LIMIT 1;
    
    IF referrer_id IS NOT NULL AND referrer_id <> NEW.id THEN
      -- Create or update referrals row as rewarded
      INSERT INTO public.referrals (referrer_user_id, referred_user_id, referral_code, status, qualified_at, rewarded_at)
      VALUES (referrer_id, NEW.id, NEW.referred_by, 'rewarded', now(), now())
      ON CONFLICT (referred_user_id) DO UPDATE SET status = 'rewarded', qualified_at = now(), rewarded_at = now();
      
      -- Grant 1 credit to referrer
      UPDATE public.users SET credits = credits + 1 WHERE id = referrer_id;
      
      -- Grant 1 credit to referee (the new user)
      UPDATE public.users SET credits = NEW.credits + 1 WHERE id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_public_user_inserted ON public.users;

CREATE TRIGGER on_public_user_inserted
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE PROCEDURE handle_public_user_inserted();
