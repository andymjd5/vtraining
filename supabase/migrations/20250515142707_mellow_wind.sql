/*
  # Reset Database Schema

  1. Changes
    - Drop all existing tables, types, and policies
    - Create new schema with proper role structure
    - Set up essential tables with proper constraints
    - Enable RLS on all tables

  2. Security
    - Implement role-based access control
    - Set up proper foreign key relationships
    - Enable row level security
*/

-- Drop existing schema
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Create essential types
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'COMPANY_ADMIN', 'STUDENT');
CREATE TYPE course_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE enrollment_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create companies table
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  url_slug text UNIQUE NOT NULL CHECK (url_slug ~ '^[a-z0-9-]+$'),
  logo_url text,
  contact_email text NOT NULL,
  contact_phone text,
  address text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role user_role NOT NULL,
  company_id uuid REFERENCES companies(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT company_id_role_check CHECK (
    (role = 'SUPER_ADMIN' AND company_id IS NULL) OR
    (role IN ('COMPANY_ADMIN', 'STUDENT') AND company_id IS NOT NULL)
  )
);

-- Create login_logs table
CREATE TABLE login_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id),
  email text NOT NULL,
  ip_address text,
  success boolean NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create activity_logs table
CREATE TABLE activity_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create platform_settings table
CREATE TABLE platform_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create roles table for RBAC
CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create permissions table for RBAC
CREATE TABLE permissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id uuid REFERENCES roles(id),
  resource text NOT NULL,
  action text NOT NULL,
  conditions jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(role_id, resource, action)
);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for companies
CREATE POLICY "Companies are viewable by authenticated users"
  ON companies FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Companies are manageable by super admins"
  ON companies FOR ALL
  USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

-- Create policies for users
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Company admins can view users in their company"
  ON users FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'COMPANY_ADMIN' AND
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Super admins can manage all users"
  ON users FOR ALL
  USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

-- Create policies for logs
CREATE POLICY "Super admins can view all logs"
  ON login_logs FOR SELECT
  USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

CREATE POLICY "Company admins can view their company logs"
  ON login_logs FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'COMPANY_ADMIN' AND
    user_id IN (
      SELECT id FROM users WHERE company_id = (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Create policies for activity logs
CREATE POLICY "Super admins can view all activity logs"
  ON activity_logs FOR SELECT
  USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

CREATE POLICY "Company admins can view their company activity logs"
  ON activity_logs FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'COMPANY_ADMIN' AND
    user_id IN (
      SELECT id FROM users WHERE company_id = (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Create policies for platform settings
CREATE POLICY "Platform settings are viewable by authenticated users"
  ON platform_settings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Platform settings are manageable by super admins"
  ON platform_settings FOR ALL
  USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

-- Create update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to log login attempts
CREATE OR REPLACE FUNCTION log_login_attempt()
RETURNS trigger AS $$
BEGIN
  INSERT INTO login_logs (user_id, email, ip_address, success)
  VALUES (
    NEW.user_id,
    (SELECT email FROM auth.users WHERE id = NEW.user_id),
    NEW.ip::text,
    true
  );
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Create trigger for login logging
CREATE TRIGGER on_auth_login
  AFTER INSERT ON auth.sessions
  FOR EACH ROW
  EXECUTE FUNCTION log_login_attempt();