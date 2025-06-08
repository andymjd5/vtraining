/*
  # Database Schema and Policy Updates

  1. Changes
    - Drop existing policies to avoid conflicts
    - Create role-based policies for users, companies, and courses tables
    - Update role validation function and trigger
    - Add proper error handling with DO blocks

  2. Security
    - Enable proper role-based access control
    - Validate user roles on insert/update
    - Ensure proper policy cascade for company admins
*/

DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Super admins can access all users" ON users;
    DROP POLICY IF EXISTS "Company admins can access their company's users" ON users;
    DROP POLICY IF EXISTS "Super admins can manage all companies" ON companies;
    DROP POLICY IF EXISTS "Company admins can view their own company" ON companies;
    DROP POLICY IF EXISTS "Super admins can manage all courses" ON courses;
    DROP POLICY IF EXISTS "Company admins can view courses" ON courses;
    DROP POLICY IF EXISTS "Agents can view active courses" ON courses;
END $$;

-- Add role-based policies for users table
CREATE POLICY "Super admins can access all users"
  ON users
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

CREATE POLICY "Company admins can access their company's users"
  ON users
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'COMPANY_ADMIN'
    AND company_id = (
      SELECT company_id
      FROM users
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'COMPANY_ADMIN'
    AND company_id = (
      SELECT company_id
      FROM users
      WHERE id = auth.uid()
    )
    AND role = 'AGENT'
  );

-- Add role-based policies for companies table
CREATE POLICY "Super admins can manage all companies"
  ON companies
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

CREATE POLICY "Company admins can view their own company"
  ON companies
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'COMPANY_ADMIN'
    AND id = (
      SELECT company_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- Add role-based policies for courses table
CREATE POLICY "Super admins can manage all courses"
  ON courses
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

CREATE POLICY "Company admins can view courses"
  ON courses
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'COMPANY_ADMIN');

CREATE POLICY "Agents can view active courses"
  ON courses
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'AGENT'
    AND active = true
  );

-- Function to validate user role during authentication
DO $$
BEGIN
    DROP FUNCTION IF EXISTS check_user_role() CASCADE;
END $$;

CREATE OR REPLACE FUNCTION check_user_role()
RETURNS trigger AS $$
BEGIN
  IF NEW.role NOT IN ('SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENT') THEN
    RAISE EXCEPTION 'Invalid user role';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS validate_user_role ON users;

-- Create trigger to validate user role
CREATE TRIGGER validate_user_role
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION check_user_role();