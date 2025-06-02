/*
  # Create test users

  1. Updates
    - Sets passwords for test users
    - Marks users as active
    - Adds authentication data
*/

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
VALUES
  -- Super Admin
  (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'super@admin.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    encode(gen_random_bytes(32), 'hex'),
    encode(gen_random_bytes(32), 'hex')
  ),
  -- Company Admin
  (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@testcompany.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    encode(gen_random_bytes(32), 'hex'),
    encode(gen_random_bytes(32), 'hex')
  );

-- Update users table to mark these users as active
UPDATE users 
SET status = 'active'
WHERE email IN ('super@admin.com', 'admin@testcompany.com');