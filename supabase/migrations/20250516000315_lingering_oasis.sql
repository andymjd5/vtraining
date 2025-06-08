/*
  # Fix RLS Policies for Users Table

  1. Changes
    - Drop existing policies on users table
    - Create new base policy for authenticated users
    - Add role-specific policies
    - Ensure proper access control

  2. Security
    - Enable read access for authenticated users
    - Maintain role-based restrictions for write operations
    - Preserve existing security model
*/

-- Drop existing policies on users table
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own data" ON users;
    DROP POLICY IF EXISTS "Company admins can view users in their company" ON users;
    DROP POLICY IF EXISTS "Super admins can manage all users" ON users;
    DROP POLICY IF EXISTS "Enable read access for all users" ON users;
END $$;

-- Create base policy for authenticated users to read
CREATE POLICY "Enable read access for all users"
ON public.users
FOR SELECT
TO authenticated
USING (true);

-- Create policy for users to manage their own data
CREATE POLICY "Users can manage their own data"
ON public.users
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create policy for company admins
CREATE POLICY "Company admins can manage their company users"
ON public.users
FOR ALL
USING (
  auth.jwt() ->> 'role' = 'COMPANY_ADMIN' AND
  company_id = (SELECT company_id FROM users WHERE id = auth.uid())
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'COMPANY_ADMIN' AND
  company_id = (SELECT company_id FROM users WHERE id = auth.uid()) AND
  role = 'STUDENT'
);

-- Create policy for super admins
CREATE POLICY "Super admins can manage all users"
ON public.users
FOR ALL
USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN')
WITH CHECK (auth.jwt() ->> 'role' = 'SUPER_ADMIN');