-- Credit purchases are stored in subscriptions.payment_history for the admin payments ledger.
-- They do not grant a Pass subscription, so the ledger row uses plan_tier='free'.
ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_tier_check;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_plan_tier_check
  CHECK (plan_tier IN ('free', 'pass', 'pro'));
