/*
  # Seed Companies and Users

  1. New Data
    - Creates 5 partner companies
    - Creates test users for each role
    - Handles existing users safely

  2. Security
    - Uses secure password hashing
    - Sets up proper role-based access control
*/

-- Insert partner companies if they don't exist
INSERT INTO companies (name, url_slug, logo_url, contact_email, contact_phone, active)
VALUES
  ('FONAREV', 'fonarev', '/partners/fonarev.png', 'contact@fonarev.org', '+243123456789', true),
  ('UNIKIN', 'unikin', '/partners/unikin.png', 'contact@unikin.ac.cd', '+243123456790', true),
  ('PNJT', 'pnjt', '/partners/pnjt.png', 'contact@pnjt.org', '+243123456791', true),
  ('BESDU', 'besdu', '/partners/besdu.png', 'contact@besdu.org', '+243123456792', true),
  ('VISION 26', 'vision26', '/partners/vision26.png', 'contact@vision26.org', '+243123456793', true)
ON CONFLICT (url_slug) DO NOTHING;

-- Function to safely create or update users
CREATE OR REPLACE FUNCTION safely_create_user(
  p_email text,
  p_password text,
  p_name text,
  p_role user_role,
  p_company_slug text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_user_id uuid;
  v_company_id uuid;
BEGIN
  -- Get company ID if needed
  IF p_company_slug IS NOT NULL THEN
    SELECT id INTO v_company_id FROM companies WHERE url_slug = p_company_slug;
  END IF;

  -- Check if auth user exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  
  IF v_user_id IS NULL THEN
    -- Create new auth user
    v_user_id := gen_random_uuid();
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
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      p_email,
      crypt(p_password, gen_salt('bf')),
      now(),
      jsonb_build_object('role', p_role),
      now(),
      now()
    );
  ELSE
    -- Update existing auth user
    UPDATE auth.users
    SET
      raw_user_meta_data = jsonb_build_object('role', p_role),
      updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Create or update user profile
  INSERT INTO users (
    id,
    email,
    name,
    role,
    company_id,
    status
  )
  VALUES (
    v_user_id,
    p_email,
    p_name,
    p_role,
    v_company_id,
    'active'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    company_id = EXCLUDED.company_id,
    status = EXCLUDED.status,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create all users
DO $$
BEGIN
  -- Super Admin
  PERFORM safely_create_user(
    'superadmin@visiontraining.cd',
    'VisionTraining2024!',
    'Super Administrator',
    'SUPER_ADMIN'
  );

  -- Company Admins
  PERFORM safely_create_user(
    'admin.fonarev@visiontraining.cd',
    'Fonarev2024!',
    'FONAREV Administrator',
    'COMPANY_ADMIN',
    'fonarev'
  );

  PERFORM safely_create_user(
    'admin@unikin.ac.cd',
    'Unikin2024!',
    'UNIKIN Administrator',
    'COMPANY_ADMIN',
    'unikin'
  );

  PERFORM safely_create_user(
    'admin@pnjt.org',
    'Pnjt2024!',
    'PNJT Administrator',
    'COMPANY_ADMIN',
    'pnjt'
  );

  PERFORM safely_create_user(
    'admin@besdu.org',
    'Besdu2024!',
    'BESDU Administrator',
    'COMPANY_ADMIN',
    'besdu'
  );

  PERFORM safely_create_user(
    'admin@vision26.org',
    'Vision262024!',
    'VISION 26 Administrator',
    'COMPANY_ADMIN',
    'vision26'
  );

  -- Students
  PERFORM safely_create_user(
    'student.fonarev@visiontraining.cd',
    'FonarevStudent2024!',
    'FONAREV Student',
    'STUDENT',
    'fonarev'
  );

  PERFORM safely_create_user(
    'student@unikin.ac.cd',
    'UnikinStudent2024!',
    'UNIKIN Student',
    'STUDENT',
    'unikin'
  );

  PERFORM safely_create_user(
    'student@pnjt.org',
    'PnjtStudent2024!',
    'PNJT Student',
    'STUDENT',
    'pnjt'
  );

  PERFORM safely_create_user(
    'student@besdu.org',
    'BesduStudent2024!',
    'BESDU Student',
    'STUDENT',
    'besdu'
  );

  PERFORM safely_create_user(
    'student@vision26.org',
    'Vision26Student2024!',
    'VISION 26 Student',
    'STUDENT',
    'vision26'
  );
END $$;

-- Clean up
DROP FUNCTION safely_create_user;