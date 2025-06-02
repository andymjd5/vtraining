/*
  # Add user management fields

  1. Changes
    - Add status field to users table to track account state
    - Add created_by field to track which admin created the user
    - Add last_login field to track user activity
    - Add policies for user management

  2. Security
    - Update policies to enforce role-based access control
    - Add policies for user creation and management
*/

-- Add new fields to users table
ALTER TABLE users 
  ADD COLUMN status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  ADD COLUMN created_by uuid REFERENCES users(id),
  ADD COLUMN last_login timestamptz;

-- Create policy for company admins to manage their company's users
CREATE POLICY "Company admins can manage users in their company" ON users
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'COMPANY_ADMIN' AND
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'COMPANY_ADMIN' AND
    company_id = (SELECT company_id FROM users WHERE id = auth.uid()) AND
    role = 'AGENT'
  );

-- Create policy for viewing user activity
CREATE POLICY "Admins can view user activity" ON users
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('SUPER_ADMIN', 'COMPANY_ADMIN')
  );

-- Function to update last_login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS trigger AS $$
BEGIN
  UPDATE users
  SET last_login = now()
  WHERE id = auth.uid();
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Trigger to update last_login on authentication
CREATE TRIGGER on_auth_login
  AFTER INSERT ON auth.sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_last_login();