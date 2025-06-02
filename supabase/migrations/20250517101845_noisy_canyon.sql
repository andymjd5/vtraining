/*
  # Enhance Security and Analytics

  1. Changes
    - Strengthen RLS policies for course management
    - Add analytics functions for dashboards
    - Create views for common analytics queries
    - Add audit logging improvements

  2. Security
    - Enforce strict role-based access
    - Add detailed activity logging
    - Implement proper data isolation
*/

-- Drop existing policies on courses table
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Courses are viewable by enrolled students" ON courses;
    DROP POLICY IF EXISTS "Courses are manageable by admins" ON courses;
END $$;

-- Create strict course management policies
CREATE POLICY "Super admin can manage courses"
ON courses
FOR ALL
USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN')
WITH CHECK (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

CREATE POLICY "Company admins can view courses"
ON courses
FOR SELECT
USING (
  auth.jwt() ->> 'role' = 'COMPANY_ADMIN' AND
  (
    id IN (
      SELECT course_id 
      FROM enrollments 
      WHERE user_id IN (
        SELECT id 
        FROM users 
        WHERE company_id = (
          SELECT company_id 
          FROM users 
          WHERE id = auth.uid()
        )
      )
    ) OR
    company_id = (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Students can view assigned courses"
ON courses
FOR SELECT
USING (
  auth.jwt() ->> 'role' = 'STUDENT' AND
  id IN (
    SELECT course_id 
    FROM enrollments 
    WHERE user_id = auth.uid()
  )
);

-- Create analytics functions
CREATE OR REPLACE FUNCTION get_company_stats(company_id uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_students', (
      SELECT COUNT(*) 
      FROM users 
      WHERE company_id = $1 
      AND role = 'STUDENT'
    ),
    'active_students', (
      SELECT COUNT(*) 
      FROM users 
      WHERE company_id = $1 
      AND role = 'STUDENT' 
      AND status = 'active'
    ),
    'total_courses', (
      SELECT COUNT(DISTINCT course_id) 
      FROM enrollments e 
      JOIN users u ON u.id = e.user_id 
      WHERE u.company_id = $1
    ),
    'completed_courses', (
      SELECT COUNT(*) 
      FROM enrollments e 
      JOIN users u ON u.id = e.user_id 
      WHERE u.company_id = $1 
      AND e.status = 'COMPLETED'
    ),
    'avg_completion_rate', (
      SELECT COALESCE(
        AVG(
          CASE 
            WHEN e.status = 'COMPLETED' THEN 100
            ELSE COALESCE(
              (
                SELECT (COUNT(*) * 100.0 / NULLIF((
                  SELECT COUNT(*) 
                  FROM lessons l2 
                  JOIN modules m2 ON m2.id = l2.module_id 
                  WHERE m2.course_id = e.course_id
                ), 0))
                FROM progress_tracking pt
                JOIN lessons l ON l.id = pt.lesson_id
                JOIN modules m ON m.id = l.module_id
                WHERE pt.enrollment_id = e.id
                AND pt.completed = true
              ), 0
            )
          END
        ), 0
      )
      FROM enrollments e
      JOIN users u ON u.id = e.user_id
      WHERE u.company_id = $1
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create analytics views
CREATE OR REPLACE VIEW company_analytics AS
SELECT 
  c.id as company_id,
  c.name as company_name,
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT CASE WHEN u.role = 'STUDENT' THEN u.id END) as total_students,
  COUNT(DISTINCT CASE WHEN u.role = 'COMPANY_ADMIN' THEN u.id END) as total_admins,
  COUNT(DISTINCT e.course_id) as total_courses,
  COUNT(DISTINCT CASE WHEN e.status = 'COMPLETED' THEN e.id END) as completed_enrollments,
  COALESCE(
    AVG(
      CASE 
        WHEN e.status = 'COMPLETED' THEN 100
        ELSE (
          SELECT (COUNT(*) * 100.0 / NULLIF((
            SELECT COUNT(*) 
            FROM lessons l2 
            JOIN modules m2 ON m2.id = l2.module_id 
            WHERE m2.course_id = e.course_id
          ), 0))
          FROM progress_tracking pt
          JOIN lessons l ON l.id = pt.lesson_id
          JOIN modules m ON m.id = l.module_id
          WHERE pt.enrollment_id = e.id
          AND pt.completed = true
        )
      END
    ), 0
  ) as avg_completion_rate
FROM 
  companies c
  LEFT JOIN users u ON u.company_id = c.id
  LEFT JOIN enrollments e ON e.user_id = u.id
GROUP BY 
  c.id, c.name;

-- Create function to get user progress
CREATE OR REPLACE FUNCTION get_user_progress(user_id uuid)
RETURNS TABLE (
  course_id uuid,
  course_title text,
  status enrollment_status,
  progress numeric,
  completed_lessons integer,
  total_lessons integer,
  last_activity timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as course_id,
    c.title as course_title,
    e.status,
    COALESCE(
      (
        SELECT (COUNT(*) * 100.0 / NULLIF((
          SELECT COUNT(*) 
          FROM lessons l2 
          JOIN modules m2 ON m2.id = l2.module_id 
          WHERE m2.course_id = c.id
        ), 0))
        FROM progress_tracking pt
        JOIN lessons l ON l.id = pt.lesson_id
        JOIN modules m ON m.id = l.module_id
        WHERE pt.enrollment_id = e.id
        AND pt.completed = true
      ), 0
    ) as progress,
    (
      SELECT COUNT(*)
      FROM progress_tracking pt
      JOIN lessons l ON l.id = pt.lesson_id
      JOIN modules m ON m.id = l.module_id
      WHERE pt.enrollment_id = e.id
      AND pt.completed = true
    ) as completed_lessons,
    (
      SELECT COUNT(*)
      FROM lessons l
      JOIN modules m ON m.id = l.module_id
      WHERE m.course_id = c.id
    ) as total_lessons,
    (
      SELECT MAX(updated_at)
      FROM progress_tracking pt
      WHERE pt.enrollment_id = e.id
    ) as last_activity
  FROM 
    enrollments e
    JOIN courses c ON c.id = e.course_id
  WHERE 
    e.user_id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhance activity logging
CREATE OR REPLACE FUNCTION log_activity()
RETURNS trigger AS $$
DECLARE
  activity_data jsonb;
  record_id uuid;
  record_data jsonb;
  user_company_id uuid;
BEGIN
  -- Get user's company_id
  SELECT company_id INTO user_company_id
  FROM users
  WHERE id = auth.uid();

  -- Get the record data based on operation type
  IF TG_OP = 'DELETE' THEN
    record_data := to_jsonb(OLD.*);
    record_id := OLD.id;
  ELSE
    record_data := to_jsonb(NEW.*);
    record_id := NEW.id;
  END IF;

  -- Build activity data
  activity_data := jsonb_build_object(
    'operation', TG_OP,
    'table', TG_TABLE_NAME,
    'data', record_data,
    'user_role', COALESCE(current_setting('app.current_role', true), auth.jwt() ->> 'role'),
    'company_id', user_company_id
  );

  -- Insert activity log
  INSERT INTO activity_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    record_id,
    activity_data
  );

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;