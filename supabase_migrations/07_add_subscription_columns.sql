ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS subscription_type TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS subscription_status TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS subscription_id TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP;

