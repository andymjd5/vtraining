/*
  # Create initial admin users

  1. New Data
    - Creates a test company
    - Creates a super admin user
    - Creates a company admin user linked to the test company

  2. Security
    - Users will need to be set up in Auth after migration
*/

-- Create test company
WITH new_company AS (
  INSERT INTO companies (name, contact_email, active)
  VALUES (
    'Test Company',
    'admin@testcompany.com',
    true
  )
  RETURNING id
)

-- Create super admin user
INSERT INTO users (email, name, role)
VALUES (
  'super@admin.com',
  'Super Administrator',
  'SUPER_ADMIN'
);

-- Create company admin user
INSERT INTO users (email, name, role, company_id)
VALUES (
  'admin@testcompany.com',
  'Company Administrator',
  'COMPANY_ADMIN',
  (SELECT id FROM companies WHERE contact_email = 'admin@testcompany.com')
);