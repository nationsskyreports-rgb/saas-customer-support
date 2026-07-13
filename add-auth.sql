-- Add password column to agents (temporary simple auth)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS password TEXT DEFAULT '123456';

-- All existing agents get default password: 123456
-- Change a specific agent's password like this:
-- UPDATE agents SET password = 'MyNewPassword' WHERE email = 'kareem@nos.com';

-- Make sure at least one agent is admin:
-- UPDATE agents SET role = 'admin' WHERE email = 'kareem@nos.com';
