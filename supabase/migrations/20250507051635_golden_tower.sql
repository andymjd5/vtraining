/*
  # Initial Database Schema

  1. New Tables
    - users
      - id (uuid, primary key)
      - email (text, unique)
      - name (text)
      - role (text)
      - company_id (uuid, foreign key)
      - created_at (timestamp)
      - updated_at (timestamp)
    
    - companies
      - id (uuid, primary key)
      - name (text)
      - logo (text)
      - contact_email (text)
      - contact_phone (text)
      - active (boolean)
      - created_at (timestamp)
      - updated_at (timestamp)
    
    - courses
      - id (uuid, primary key)
      - title (text)
      - description (text)
      - content (text)
      - category (text)
      - duration (integer)
      - active (boolean)
      - created_at (timestamp)
      - updated_at (timestamp)
    
    - enrollments
      - id (uuid, primary key)
      - user_id (uuid, foreign key)
      - course_id (uuid, foreign key)
      - progress (integer)
      - status (text)
      - started_at (timestamp)
      - completed_at (timestamp)
      - created_at (timestamp)
      - updated_at (timestamp)
    
    - quizzes
      - id (uuid, primary key)
      - course_id (uuid, foreign key)
      - title (text)
      - description (text)
      - time_limit (integer)
      - passing_score (integer)
      - created_at (timestamp)
      - updated_at (timestamp)
    
    - questions
      - id (uuid, primary key)
      - quiz_id (uuid, foreign key)
      - text (text)
      - created_at (timestamp)
      - updated_at (timestamp)
    
    - options
      - id (uuid, primary key)
      - question_id (uuid, foreign key)
      - text (text)
      - is_correct (boolean)
      - created_at (timestamp)
      - updated_at (timestamp)
    
    - certificates
      - id (uuid, primary key)
      - user_id (uuid, foreign key)
      - course_id (uuid, foreign key)
      - quiz_id (uuid, foreign key)
      - issue_date (timestamp)
      - certificate_number (text)
      - created_at (timestamp)
      - updated_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for each role
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENT');
CREATE TYPE course_category AS ENUM ('HUMAN_RIGHTS', 'HUMANITARIAN_LAW', 'TRANSITIONAL_JUSTICE', 'PSYCHOLOGICAL_SUPPORT', 'COMPUTER_SCIENCE', 'ENGLISH');
CREATE TYPE enrollment_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- Create companies table
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  logo text,
  contact_email text NOT NULL,
  contact_phone text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role user_role NOT NULL DEFAULT 'AGENT',
  company_id uuid REFERENCES companies(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create courses table
CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  content text,
  category course_category NOT NULL,
  duration integer NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create enrollments table
CREATE TABLE enrollments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  progress integer DEFAULT 0,
  status enrollment_status DEFAULT 'NOT_STARTED',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Create quizzes table
CREATE TABLE quizzes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  time_limit integer NOT NULL,
  passing_score integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create questions table
CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create options table
CREATE TABLE options (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  text text NOT NULL,
  is_correct boolean NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create certificates table
CREATE TABLE certificates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  issue_date timestamptz DEFAULT now(),
  certificate_number text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE options ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Create policies for companies
CREATE POLICY "Companies are viewable by authenticated users" ON companies
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Companies are manageable by super admins" ON companies
  FOR ALL USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

-- Create policies for users
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Company admins can view users in their company" ON users
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'COMPANY_ADMIN' AND
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Super admins can manage all users" ON users
  FOR ALL USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

-- Create policies for courses
CREATE POLICY "Courses are viewable by authenticated users" ON courses
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Courses are manageable by super admins" ON courses
  FOR ALL USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

-- Create policies for enrollments
CREATE POLICY "Users can view their own enrollments" ON enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own enrollments" ON enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Company admins can view enrollments in their company" ON enrollments
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'COMPANY_ADMIN' AND
    user_id IN (
      SELECT id FROM users 
      WHERE company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    )
  );

-- Create policies for quizzes
CREATE POLICY "Quizzes are viewable by authenticated users" ON quizzes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Quizzes are manageable by super admins" ON quizzes
  FOR ALL USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

-- Create policies for questions and options
CREATE POLICY "Questions are viewable by authenticated users" ON questions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Options are viewable by authenticated users" ON options
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create policies for certificates
CREATE POLICY "Users can view their own certificates" ON certificates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Company admins can view certificates in their company" ON certificates
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'COMPANY_ADMIN' AND
    user_id IN (
      SELECT id FROM users 
      WHERE company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    )
  );

-- Create update triggers for updated_at columns
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

CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at
    BEFORE UPDATE ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at
    BEFORE UPDATE ON quizzes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_options_updated_at
    BEFORE UPDATE ON options
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at
    BEFORE UPDATE ON certificates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();