-- Clean active plan tiers to the two labels used by the product.
-- Credit purchases are recorded as free ledger rows; paid legacy plan rows remain pass.
UPDATE users
SET plan_tier = 'pass'
WHERE plan_tier = 'pro';

UPDATE subscriptions
SET plan_tier = 'pass'
WHERE plan_tier = 'pro';

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_plan_tier_check;

ALTER TABLE users
  ADD CONSTRAINT users_plan_tier_check
  CHECK (plan_tier IN ('free', 'pass'));

ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_tier_check;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_plan_tier_check
  CHECK (plan_tier IN ('free', 'pass'));
