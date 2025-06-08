/*
  # Add Vision Training Companies and Test Users

  1. New Data
    - Creates all project companies
    - Creates test users for each company
    - Sets up authentication for test users

  2. Security
    - Handles potential conflicts using ON CONFLICT clauses
    - Uses secure password hashing
*/

-- Insert companies
INSERT INTO companies (name, contact_email, contact_phone, active)
VALUES
  ('FONAREV', 'contact@fonarev.org', '+243123456789', true),
  ('UNIKIN', 'contact@unikin.ac.cd', '+243234567890', true),
  ('VISION 26', 'contact@vision26.org', '+243345678901', true),
  ('PNJT', 'contact@pnjt.cd', '+243456789012', true),
  ('BESDU', 'contact@besdu.org', '+243567890123', true)
ON CONFLICT (name) DO UPDATE SET
  contact_email = EXCLUDED.contact_email,
  contact_phone = EXCLUDED.contact_phone,
  active = EXCLUDED.active;

-- Create test users
INSERT INTO users (email, name, role, company_id, status)
SELECT 
  'test@' || lower(replace(c.name, ' ', '')) || '.org',
  'Test User ' || c.name,
  'AGENT',
  c.id,
  'active'
FROM companies c
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  company_id = EXCLUDED.company_id,
  status = EXCLUDED.status;

-- Create authentication for test users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  u.id,
  'authenticated',
  'authenticated',
  u.email,
  crypt('Test123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  encode(gen_random_bytes(32), 'hex'),
  encode(gen_random_bytes(32), 'hex')
FROM users u
WHERE u.email LIKE 'test@%'
ON CONFLICT (email) DO NOTHING;