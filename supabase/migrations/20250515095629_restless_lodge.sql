/*
  # Fix User Authentication and Policies

  1. Updates
    - Drop and recreate policies with unique names
    - Clean up invalid user data
    - Synchronize users with auth.users table

  2. Security
    - Enable RLS
    - Set up role-based policies
    - Ensure proper authentication checks
*/

-- First, ensure we have the proper RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DO $$ 
DECLARE
    policy_name text;
BEGIN
    FOR policy_name IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users' OR tablename = 'companies'
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, 'users');
    END LOOP;
END $$;

-- Add base authentication policy for users table
CREATE POLICY "users_read_authenticated_20250515"
  ON users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Add policy for users to access their own data
CREATE POLICY "users_manage_own_20250515"
  ON users
  FOR ALL
  USING (auth.uid() = id);

-- Add policy for company admins
CREATE POLICY "users_company_admin_manage_20250515"
  ON users
  FOR ALL
  USING (
    (auth.jwt() ->> 'role' = 'COMPANY_ADMIN') AND 
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  )
  WITH CHECK (
    (auth.jwt() ->> 'role' = 'COMPANY_ADMIN') AND 
    company_id = (SELECT company_id FROM users WHERE id = auth.uid()) AND 
    role = 'AGENT'
  );

-- Add policy for super admins
CREATE POLICY "users_super_admin_manage_20250515"
  ON users
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

-- Ensure companies table has proper authentication policy
DO $$ 
DECLARE
    policy_name text;
BEGIN
    FOR policy_name IN (SELECT policyname FROM pg_policies WHERE tablename = 'companies')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON companies', policy_name);
    END LOOP;
END $$;

CREATE POLICY "companies_read_authenticated_20250515"
  ON companies
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Clean up any invalid data (where id contains email)
DELETE FROM users
WHERE id::text ~ '@';

-- Synchronize users table with auth.users
DO $$
DECLARE
  auth_user RECORD;
BEGIN
  -- Loop through auth.users
  FOR auth_user IN (SELECT * FROM auth.users) LOOP
    -- Insert or update corresponding row in public.users
    INSERT INTO users (
      id,
      email,
      name,
      role,
      status,
      created_at,
      updated_at
    )
    VALUES (
      auth_user.id,
      auth_user.email,
      COALESCE(auth_user.raw_user_meta_data->>'name', 'User ' || auth_user.email),
      COALESCE(auth_user.raw_user_meta_data->>'role', 'AGENT')::user_role,
      'active',
      auth_user.created_at,
      auth_user.updated_at
    )
    ON CONFLICT (id) DO UPDATE
    SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      updated_at = now();
  END LOOP;
END $$;