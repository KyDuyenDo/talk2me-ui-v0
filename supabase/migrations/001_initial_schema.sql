-- ================================================
-- Talk2Me LearnTube — Initial Schema
-- Migration: 001_initial_schema.sql
-- ================================================

-- ================================================
-- ENUMS
-- ================================================
CREATE TYPE job_status AS ENUM ('queued','generating','paused_quota','completed','failed');
CREATE TYPE task_status AS ENUM ('pending','in_progress','done','failed');
CREATE TYPE squad_role AS ENUM ('owner','member');
CREATE TYPE vocab_source AS ENUM ('theory','result','manual');
CREATE TYPE flashcard_status AS ENUM ('new','learning','mastered');

-- ================================================
-- TABLE: profiles
-- Extension của auth.users Supabase
-- ================================================
CREATE TABLE profiles (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email                   text UNIQUE NOT NULL,
  password_hash           text,
  name                    text NOT NULL,
  username                text,
  avatar_url              text,
  target_goal             text DEFAULT 'IELTS 6.5+',
  current_level           text DEFAULT 'Intermediate (B1-B2)',
  streak_days             int NOT NULL DEFAULT 0,
  total_study_minutes     int NOT NULL DEFAULT 0,
  completed_lessons_count int NOT NULL DEFAULT 0,
  subscription_tier       text DEFAULT 'Free Member',
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- Trigger tự tạo profile khi user đăng ký
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ================================================
-- TABLE: courses
-- Cache-key = youtube_video_id (UNIQUE)
-- ================================================
CREATE TABLE courses (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_video_id text UNIQUE NOT NULL,
  title            text NOT NULL,
  description      text,
  category         text,
  difficulty       text CHECK (difficulty IN ('Beginner','Intermediate','Advanced')),
  thumbnail_url    text,
  channel_name     text,
  duration_text    text,
  is_public        boolean NOT NULL DEFAULT true,
  created_by       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  creation_status  text NOT NULL DEFAULT 'processing'
                   CHECK (creation_status IN ('processing','completed','failed')),
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_courses_video_id ON courses(youtube_video_id);
CREATE INDEX idx_courses_public ON courses(is_public, created_at DESC);

-- ================================================
-- TABLE: lessons
-- ================================================
CREATE TABLE lessons (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_index    int NOT NULL,
  title           text NOT NULL,
  start_seconds   int NOT NULL DEFAULT 0,
  end_seconds     int NOT NULL,
  theory_content  text,
  key_takeaways   text[] DEFAULT '{}',
  available_modes text[] DEFAULT '{"theory","quiz","dictation","shadowing","writing","speaking"}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, lesson_index)
);

CREATE INDEX idx_lessons_course ON lessons(course_id, lesson_index);

-- ================================================
-- TABLE: exercises
-- payload_json giữ dữ liệu bài tập theo mode
-- ================================================
CREATE TABLE exercises (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id    uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  type         text NOT NULL CHECK (type IN ('quiz','dictation','shadowing','writing','speaking')),
  payload_json jsonb NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_exercises_lesson ON exercises(lesson_id, type);

-- ================================================
-- FLASHCARD SYSTEM
-- ================================================
CREATE TABLE flashcard_folders (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name       text NOT NULL,
  color      text DEFAULT '#2E68FF',
  icon       text DEFAULT 'folder',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE flashcard_sets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id   uuid REFERENCES flashcard_folders(id) ON DELETE SET NULL,
  owner_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  is_public   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE flashcards (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id           uuid REFERENCES flashcard_sets(id) ON DELETE CASCADE,
  owner_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  front_text       text NOT NULL,
  back_text        text NOT NULL,
  phonetic         text,
  example_sentence text,
  image_url        text,
  -- SRS fields (SM-2 algorithm)
  interval_days    int NOT NULL DEFAULT 0,
  ease_factor      numeric(4,2) NOT NULL DEFAULT 2.5,
  repetitions      int NOT NULL DEFAULT 0,
  next_review_date date NOT NULL DEFAULT CURRENT_DATE,
  status           flashcard_status NOT NULL DEFAULT 'new',
  is_starred       boolean NOT NULL DEFAULT false,
  -- Video flashcard (zero storage — just a pointer)
  source_video_id  text,
  clip_start_sec   int,
  clip_end_sec     int,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_flashcards_review ON flashcards(owner_id, next_review_date, status);

CREATE TABLE review_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id     uuid NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quality     int NOT NULL CHECK (quality BETWEEN 0 AND 5),
  reviewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_review_logs_card ON review_logs(card_id, reviewed_at DESC);

-- ================================================
-- TABLE: vocabulary
-- ================================================
CREATE TABLE vocabulary (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  term             text NOT NULL,
  definition       text,
  phonetic         text,
  example_sentence text,
  source_lesson_id uuid REFERENCES lessons(id) ON DELETE SET NULL,
  source_type      vocab_source NOT NULL DEFAULT 'manual',
  saved_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, term)
);

-- ================================================
-- COMMUNITY / SQUADS
-- ================================================
CREATE TABLE squads (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  owner_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invite_code text UNIQUE NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE squad_members (
  squad_id  uuid NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role      squad_role NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (squad_id, user_id)
);

CREATE TABLE squad_resources (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id      uuid NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  resource_type text NOT NULL CHECK (resource_type IN ('course','flashcard_set')),
  resource_id   uuid NOT NULL,
  added_by      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  added_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE squad_tasks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id      uuid NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  title         text NOT NULL,
  resource_type text CHECK (resource_type IN ('lesson','flashcard_set')),
  resource_id   uuid,
  due_date      date,
  created_by    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE squad_task_progress (
  task_id      uuid NOT NULL REFERENCES squad_tasks(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed')),
  completed_at timestamptz,
  PRIMARY KEY (task_id, user_id)
);

CREATE TABLE live_rooms (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id   uuid NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  room_name  text UNIQUE NOT NULL,
  host_id    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  is_active  boolean NOT NULL DEFAULT true,
  started_at timestamptz NOT NULL DEFAULT now()
);

-- ================================================
-- PROGRESS TRACKING
-- ================================================
CREATE TABLE user_progress (
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id  uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  mode       text NOT NULL CHECK (mode IN ('theory','quiz','dictation','shadowing','writing','speaking')),
  completed  boolean NOT NULL DEFAULT false,
  accuracy   numeric(5,2),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id, mode)
);

CREATE INDEX idx_user_progress_user ON user_progress(user_id, completed);

-- ================================================
-- BACKGROUND JOB SYSTEM (P1)
-- ================================================
CREATE TABLE generation_jobs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id        uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  youtube_video_id text NOT NULL,
  status           job_status NOT NULL DEFAULT 'queued',
  total_units      int NOT NULL DEFAULT 0,
  completed_units  int NOT NULL DEFAULT 0,
  last_error       text,
  next_retry_at    timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_jobs_status_retry ON generation_jobs(status, next_retry_at);

CREATE TABLE generation_tasks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id     uuid NOT NULL REFERENCES generation_jobs(id) ON DELETE CASCADE,
  unit_type  text NOT NULL,
  unit_ref   text,
  status     task_status NOT NULL DEFAULT 'pending',
  attempts   int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_job_status ON generation_tasks(job_id, status);

-- ================================================
-- ROW LEVEL SECURITY
-- ================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_task_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_tasks ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- COURSES: đọc public hoặc của mình; ghi chỉ của mình
CREATE POLICY "courses_select" ON courses FOR SELECT
  USING (is_public = true OR created_by = auth.uid());
CREATE POLICY "courses_insert" ON courses FOR INSERT
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "courses_update" ON courses FOR UPDATE
  USING (created_by = auth.uid());
CREATE POLICY "courses_delete" ON courses FOR DELETE
  USING (created_by = auth.uid());

-- LESSONS: đọc nếu đọc được course
CREATE POLICY "lessons_select" ON lessons FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM courses c WHERE c.id = lessons.course_id
    AND (c.is_public = true OR c.created_by = auth.uid())
  ));
CREATE POLICY "lessons_insert" ON lessons FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM courses c WHERE c.id = lessons.course_id AND c.created_by = auth.uid()
  ));

-- EXERCISES: đọc nếu đọc được lesson
CREATE POLICY "exercises_select" ON exercises FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM lessons l JOIN courses c ON c.id = l.course_id
    WHERE l.id = exercises.lesson_id
    AND (c.is_public = true OR c.created_by = auth.uid())
  ));

-- FLASHCARD FOLDERS
CREATE POLICY "flashcard_folders_own" ON flashcard_folders FOR ALL
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- FLASHCARD SETS: đọc public hoặc của mình
CREATE POLICY "flashcard_sets_select" ON flashcard_sets FOR SELECT
  USING (owner_id = auth.uid() OR is_public = true);
CREATE POLICY "flashcard_sets_write" ON flashcard_sets FOR ALL
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- FLASHCARDS
CREATE POLICY "flashcards_own" ON flashcards FOR ALL
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- REVIEW LOGS
CREATE POLICY "review_logs_own" ON review_logs FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- VOCABULARY
CREATE POLICY "vocabulary_own" ON vocabulary FOR ALL
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- SQUADS: thành viên xem squad của mình; owner ghi
CREATE POLICY "squads_member_select" ON squads FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM squad_members sm WHERE sm.squad_id = squads.id AND sm.user_id = auth.uid()
  ));
CREATE POLICY "squads_owner_insert" ON squads FOR INSERT
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "squads_owner_update" ON squads FOR UPDATE
  USING (owner_id = auth.uid());
CREATE POLICY "squads_owner_delete" ON squads FOR DELETE
  USING (owner_id = auth.uid());

-- SQUAD MEMBERS
CREATE POLICY "squad_members_select" ON squad_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM squad_members sm WHERE sm.squad_id = squad_members.squad_id AND sm.user_id = auth.uid()
  ));
CREATE POLICY "squad_members_insert" ON squad_members FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "squad_members_delete" ON squad_members FOR DELETE
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM squads s WHERE s.id = squad_members.squad_id AND s.owner_id = auth.uid()
  ));

-- SQUAD RESOURCES, TASKS, TASK PROGRESS, LIVE ROOMS
CREATE POLICY "squad_resources_member" ON squad_resources FOR ALL
  USING (EXISTS (
    SELECT 1 FROM squad_members sm WHERE sm.squad_id = squad_resources.squad_id AND sm.user_id = auth.uid()
  ));

CREATE POLICY "squad_tasks_member_select" ON squad_tasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM squad_members sm WHERE sm.squad_id = squad_tasks.squad_id AND sm.user_id = auth.uid()
  ));
CREATE POLICY "squad_tasks_owner_write" ON squad_tasks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM squads s WHERE s.id = squad_tasks.squad_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "squad_task_progress_own" ON squad_task_progress FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "live_rooms_member" ON live_rooms FOR ALL
  USING (EXISTS (
    SELECT 1 FROM squad_members sm WHERE sm.squad_id = live_rooms.squad_id AND sm.user_id = auth.uid()
  ));

-- USER PROGRESS
CREATE POLICY "user_progress_own" ON user_progress FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- GENERATION JOBS & TASKS (server-side only via service_role, nhưng user đọc của mình)
CREATE POLICY "generation_jobs_own" ON generation_jobs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM courses c WHERE c.id = generation_jobs.course_id AND c.created_by = auth.uid()
  ));

CREATE POLICY "generation_tasks_own" ON generation_tasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM generation_jobs j JOIN courses c ON c.id = j.course_id
    WHERE j.id = generation_tasks.job_id AND c.created_by = auth.uid()
  ));

-- ================================================
-- HELPER FUNCTION: Atomic task claim for background jobs
-- ================================================
CREATE OR REPLACE FUNCTION claim_next_task(p_job_id uuid)
RETURNS generation_tasks AS $$
DECLARE
  claimed generation_tasks;
BEGIN
  UPDATE generation_tasks
  SET    status = 'in_progress', attempts = attempts + 1, updated_at = now()
  WHERE  id = (
    SELECT id FROM generation_tasks
    WHERE  job_id = p_job_id AND status = 'pending'
    ORDER  BY created_at
    FOR UPDATE SKIP LOCKED
    LIMIT  1
  )
  RETURNING * INTO claimed;
  RETURN claimed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- HELPER FUNCTION: Increment completed units
-- ================================================
CREATE OR REPLACE FUNCTION increment_completed_units(p_job_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE generation_jobs
  SET    completed_units = completed_units + 1, updated_at = now()
  WHERE  id = p_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- LEADERBOARD RPC (P3)
-- ================================================
CREATE OR REPLACE FUNCTION get_squad_leaderboard(
  p_squad_id uuid,
  p_metric   text DEFAULT 'lessons'
)
RETURNS TABLE(
  user_id           uuid,
  username          text,
  avatar_url        text,
  streak_days       int,
  lessons_completed bigint,
  cards_mastered    bigint,
  rank              bigint
) AS $$
SELECT
  p.id,
  p.username,
  p.avatar_url,
  p.streak_days,
  COUNT(DISTINCT CASE WHEN up.completed = true THEN up.lesson_id END) AS lessons_completed,
  COUNT(DISTINCT CASE WHEN f.status = 'mastered' THEN f.id END)       AS cards_mastered,
  RANK() OVER (
    ORDER BY
      CASE p_metric
        WHEN 'streak'  THEN p.streak_days::bigint
        WHEN 'lessons' THEN COUNT(DISTINCT CASE WHEN up.completed = true THEN up.lesson_id END)
        WHEN 'cards'   THEN COUNT(DISTINCT CASE WHEN f.status = 'mastered' THEN f.id END)
        ELSE COUNT(DISTINCT CASE WHEN up.completed = true THEN up.lesson_id END)
      END DESC
  ) AS rank
FROM   profiles p
JOIN   squad_members sm ON p.id = sm.user_id AND sm.squad_id = p_squad_id
LEFT JOIN user_progress up ON p.id = up.user_id
LEFT JOIN flashcards    f  ON p.id = f.owner_id
GROUP BY p.id, p.username, p.avatar_url, p.streak_days;
$$ LANGUAGE SQL SECURITY DEFINER;
