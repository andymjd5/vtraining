/*
  # LMS Schema Migration

  1. New Tables
    - Course management (courses, modules, lessons)
    - Quiz system (quizzes, questions, options)
    - Assignment system (assignments, submissions)
    - Progress tracking (enrollments, progress)
    - Notifications
    - Media files
    - Certificates

  2. Security
    - Enable RLS on all tables
    - Add role-based policies
    - Set up audit logging
*/

-- Create course-related tables
CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  thumbnail_url text,
  status course_status DEFAULT 'DRAFT',
  company_id uuid REFERENCES companies(id),
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE modules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  position integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE lessons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id uuid REFERENCES modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  duration integer, -- in minutes
  position integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create quiz-related tables
CREATE TABLE quizzes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  time_limit integer, -- in minutes
  passing_score integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE quiz_questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  question text NOT NULL,
  type text NOT NULL CHECK (type IN ('multiple_choice', 'true_false', 'short_answer')),
  points integer DEFAULT 1,
  position integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE quiz_options (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id uuid REFERENCES quiz_questions(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  is_correct boolean NOT NULL,
  position integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create assignment-related tables
CREATE TABLE assignments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date timestamptz,
  points integer DEFAULT 100,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE submissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id uuid REFERENCES assignments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  content text,
  file_urls jsonb,
  score integer,
  feedback text,
  submitted_at timestamptz DEFAULT now(),
  graded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create enrollment and progress tracking
CREATE TABLE enrollments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id),
  course_id uuid REFERENCES courses(id),
  status enrollment_status DEFAULT 'NOT_STARTED',
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

CREATE TABLE progress_tracking (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id uuid REFERENCES enrollments(id),
  lesson_id uuid REFERENCES lessons(id),
  completed boolean DEFAULT false,
  last_position integer DEFAULT 0,
  time_spent integer DEFAULT 0, -- in seconds
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(enrollment_id, lesson_id)
);

-- Create notification system
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  read boolean DEFAULT false,
  action_url text,
  created_at timestamptz DEFAULT now()
);

-- Create media management
CREATE TABLE media_files (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id uuid REFERENCES courses(id),
  lesson_id uuid REFERENCES lessons(id),
  filename text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL, -- in bytes
  uploaded_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Create certificates
CREATE TABLE certificates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id uuid REFERENCES enrollments(id),
  certificate_number text UNIQUE NOT NULL,
  issued_at timestamptz DEFAULT now(),
  template_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Create policies for courses
CREATE POLICY "Courses are viewable by enrolled students"
  ON courses FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    (
      id IN (
        SELECT course_id FROM enrollments WHERE user_id = auth.uid()
      ) OR
      company_id = (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Courses are manageable by admins"
  ON courses FOR ALL
  USING (
    auth.jwt() ->> 'role' IN ('SUPER_ADMIN', 'COMPANY_ADMIN')
  )
  WITH CHECK (
    CASE
      WHEN auth.jwt() ->> 'role' = 'SUPER_ADMIN' THEN true
      WHEN auth.jwt() ->> 'role' = 'COMPANY_ADMIN' THEN
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
      ELSE false
    END
  );

-- Create policies for modules and lessons
CREATE POLICY "Content is viewable by enrolled students"
  ON modules FOR SELECT
  USING (
    course_id IN (
      SELECT course_id FROM enrollments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Content is manageable by admins"
  ON modules FOR ALL
  USING (
    auth.jwt() ->> 'role' IN ('SUPER_ADMIN', 'COMPANY_ADMIN')
  )
  WITH CHECK (
    CASE
      WHEN auth.jwt() ->> 'role' = 'SUPER_ADMIN' THEN true
      WHEN auth.jwt() ->> 'role' = 'COMPANY_ADMIN' THEN
        course_id IN (
          SELECT id FROM courses
          WHERE company_id = (SELECT company_id FROM users WHERE id = auth.uid())
        )
      ELSE false
    END
  );

-- Similar policies for lessons
CREATE POLICY "Lessons are viewable by enrolled students"
  ON lessons FOR SELECT
  USING (
    module_id IN (
      SELECT m.id FROM modules m
      JOIN enrollments e ON e.course_id = m.course_id
      WHERE e.user_id = auth.uid()
    )
  );

-- Create policies for enrollments
CREATE POLICY "Students can view their enrollments"
  ON enrollments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Company admins can manage enrollments"
  ON enrollments FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'COMPANY_ADMIN' AND
    user_id IN (
      SELECT id FROM users
      WHERE company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    )
  );

-- Create policies for progress tracking
CREATE POLICY "Students can view and update their progress"
  ON progress_tracking FOR ALL
  USING (
    enrollment_id IN (
      SELECT id FROM enrollments WHERE user_id = auth.uid()
    )
  );

-- Create policies for notifications
CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can mark their notifications as read"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() AND
    read = true
  );

-- Create policies for media files
CREATE POLICY "Media files are accessible to enrolled students"
  ON media_files FOR SELECT
  USING (
    course_id IN (
      SELECT course_id FROM enrollments WHERE user_id = auth.uid()
    ) OR
    lesson_id IN (
      SELECT l.id FROM lessons l
      JOIN modules m ON m.id = l.module_id
      JOIN enrollments e ON e.course_id = m.course_id
      WHERE e.user_id = auth.uid()
    )
  );

-- Create policies for certificates
CREATE POLICY "Students can view their certificates"
  ON certificates FOR SELECT
  USING (
    enrollment_id IN (
      SELECT id FROM enrollments WHERE user_id = auth.uid()
    )
  );

-- Create triggers for activity logging
CREATE OR REPLACE FUNCTION log_activity()
RETURNS trigger AS $$
DECLARE
  activity_data jsonb;
  record_id uuid;
  record_data jsonb;
BEGIN
  -- Get the record data based on operation type
  IF TG_OP = 'DELETE' THEN
    record_data := to_jsonb(TG_OLD.*);
    record_id := (TG_OLD).id;
  ELSE
    record_data := to_jsonb(TG_NEW.*);
    record_id := (TG_NEW).id;
  END IF;

  -- Build activity data
  activity_data := jsonb_build_object(
    'operation', TG_OP,
    'table', TG_TABLE_NAME,
    'data', record_data
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

-- Add activity logging triggers
CREATE TRIGGER log_course_changes
  AFTER INSERT OR UPDATE OR DELETE ON courses
  FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_module_changes
  AFTER INSERT OR UPDATE OR DELETE ON modules
  FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_lesson_changes
  AFTER INSERT OR UPDATE OR DELETE ON lessons
  FOR EACH ROW EXECUTE FUNCTION log_activity();

-- Add updated_at triggers for all new tables
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at
  BEFORE UPDATE ON modules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON quizzes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at
  BEFORE UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_tracking_updated_at
  BEFORE UPDATE ON progress_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create notifications
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text DEFAULT 'info',
  p_action_url text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    action_url
  ) VALUES (
    p_user_id,
    p_title,
    p_message,
    p_type,
    p_action_url
  ) RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS text AS $$
DECLARE
  v_prefix text := 'CERT';
  v_year text := to_char(current_date, 'YYYY');
  v_sequence integer;
  v_certificate_number text;
BEGIN
  -- Get next sequence number for this year
  WITH new_sequence AS (
    SELECT COUNT(*) + 1 as seq
    FROM certificates
    WHERE certificate_number LIKE v_prefix || '-' || v_year || '-%'
  )
  SELECT seq INTO v_sequence FROM new_sequence;

  -- Format certificate number
  v_certificate_number := v_prefix || '-' || v_year || '-' || LPAD(v_sequence::text, 6, '0');

  RETURN v_certificate_number;
END;
$$ LANGUAGE plpgsql;