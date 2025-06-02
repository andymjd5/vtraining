/*
  # Add Companies and Company Admins

  1. New Data
    - Creates 5 companies:
      - FONAREV
      - UNIKIN
      - PNJT
      - BESDU
      - VISION 26
    - Creates company admin users for each company
    - Sets up secure test credentials

  2. Security
    - Uses secure password hashing
    - Sets up proper role-based access control
*/

-- Create companies
INSERT INTO companies (name, contact_email, contact_phone, logo, active)
VALUES
  ('FONAREV', 'admin@fonarev.org', '+243123456789', '/partners/fonarev.png', true),
  ('UNIKIN', 'admin@unikin.ac.cd', '+243123456790', '/partners/unikin.png', true),
  ('PNJT', 'admin@pnjt.org', '+243123456791', '/partners/pnjt.png', true),
  ('BESDU', 'admin@besdu.org', '+243123456792', '/partners/besdu.png', true),
  ('VISION 26', 'admin@vision26.org', '+243123456793', '/partners/vision26.png', true);

-- Create company admin users in auth.users
DO $$
DECLARE
  fonarev_id uuid;
  unikin_id uuid;
  pnjt_id uuid;
  besdu_id uuid;
  vision26_id uuid;
BEGIN
  -- Get company IDs
  SELECT id INTO fonarev_id FROM companies WHERE name = 'FONAREV';
  SELECT id INTO unikin_id FROM companies WHERE name = 'UNIKIN';
  SELECT id INTO pnjt_id FROM companies WHERE name = 'PNJT';
  SELECT id INTO besdu_id FROM companies WHERE name = 'BESDU';
  SELECT id INTO vision26_id FROM companies WHERE name = 'VISION 26';

  -- Create auth users for company admins
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES
    (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@fonarev.org',
      crypt('Fonarev2024!', gen_salt('bf')),
      now(),
      jsonb_build_object('role', 'COMPANY_ADMIN'),
      now(),
      now()
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@unikin.ac.cd',
      crypt('Unikin2024!', gen_salt('bf')),
      now(),
      jsonb_build_object('role', 'COMPANY_ADMIN'),
      now(),
      now()
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@pnjt.org',
      crypt('Pnjt2024!', gen_salt('bf')),
      now(),
      jsonb_build_object('role', 'COMPANY_ADMIN'),
      now(),
      now()
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@besdu.org',
      crypt('Besdu2024!', gen_salt('bf')),
      now(),
      jsonb_build_object('role', 'COMPANY_ADMIN'),
      now(),
      now()
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@vision26.org',
      crypt('Vision262024!', gen_salt('bf')),
      now(),
      jsonb_build_object('role', 'COMPANY_ADMIN'),
      now(),
      now()
    );

  -- Create user profiles for company admins
  INSERT INTO users (
    id,
    email,
    name,
    role,
    company_id,
    status
  )
  SELECT
    au.id,
    au.email,
    CASE 
      WHEN au.email = 'admin@fonarev.org' THEN 'FONAREV Admin'
      WHEN au.email = 'admin@unikin.ac.cd' THEN 'UNIKIN Admin'
      WHEN au.email = 'admin@pnjt.org' THEN 'PNJT Admin'
      WHEN au.email = 'admin@besdu.org' THEN 'BESDU Admin'
      WHEN au.email = 'admin@vision26.org' THEN 'VISION 26 Admin'
    END,
    'COMPANY_ADMIN',
    CASE 
      WHEN au.email = 'admin@fonarev.org' THEN fonarev_id
      WHEN au.email = 'admin@unikin.ac.cd' THEN unikin_id
      WHEN au.email = 'admin@pnjt.org' THEN pnjt_id
      WHEN au.email = 'admin@besdu.org' THEN besdu_id
      WHEN au.email = 'admin@vision26.org' THEN vision26_id
    END,
    'active'
  FROM auth.users au
  WHERE au.email IN (
    'admin@fonarev.org',
    'admin@unikin.ac.cd',
    'admin@pnjt.org',
    'admin@besdu.org',
    'admin@vision26.org'
  );
END $$;