/*
  # Add Role-Based Access Control Policies

  1. Updates
    - Add role-based policies for authentication
    - Add user metadata for role management
    - Update existing policies to include role checks

  2. Security
    - Enforce strict role-based access control
    - Prevent unauthorized access to admin features
*/

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
CREATE OR REPLACE FUNCTION check_user_role()
RETURNS trigger AS $$
BEGIN
  IF NEW.role NOT IN ('SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENT') THEN
    RAISE EXCEPTION 'Invalid user role';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate user role
CREATE TRIGGER validate_user_role
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION check_user_role();