/*
  # Create super admin user

  1. New Data
    - Creates a super admin user with secure credentials
    - Sets up proper role metadata and permissions

  2. Security
    - Uses secure password hashing
    - Sets up proper role-based access control
    - Handles potential duplicates safely
*/

-- Create super admin user in auth.users if it doesn't exist
DO $$
DECLARE
  auth_user_id uuid;
BEGIN
  -- Check if user exists in auth.users
  SELECT id INTO auth_user_id
  FROM auth.users
  WHERE email = 'andymjd5@gmail.com';

  -- If user doesn't exist, create it
  IF auth_user_id IS NULL THEN
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
      raw_user_meta_data
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'andymjd5@gmail.com',
      crypt('Huaweiy300', gen_salt('bf')),
      now(),
      now(),
      now(),
      jsonb_build_object('role', 'SUPER_ADMIN')
    )
    RETURNING id INTO auth_user_id;

    -- Create corresponding user profile in public.users
    INSERT INTO public.users (
      id,
      email,
      name,
      role,
      status
    )
    VALUES (
      auth_user_id,
      'andymjd5@gmail.com',
      'Super Administrator',
      'SUPER_ADMIN',
      'active'
    );
  ELSE
    -- Update existing user if needed
    UPDATE auth.users
    SET
      raw_user_meta_data = jsonb_build_object('role', 'SUPER_ADMIN'),
      updated_at = now()
    WHERE id = auth_user_id;

    -- Ensure public.users record exists and is up to date
    INSERT INTO public.users (
      id,
      email,
      name,
      role,
      status
    )
    VALUES (
      auth_user_id,
      'andymjd5@gmail.com',
      'Super Administrator',
      'SUPER_ADMIN',
      'active'
    )
    ON CONFLICT (id) DO UPDATE
    SET
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      status = EXCLUDED.status,
      updated_at = now();
  END IF;
END $$;