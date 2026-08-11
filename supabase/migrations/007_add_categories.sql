-- Per-user course categories (previously a hardcoded shared list persisted only in
-- localStorage). courses.category stays a free-text column, unchanged — this table is just
-- each user's own saved/suggested list shown in the course-creation category picker.
CREATE TABLE categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name       text NOT NULL,
  color      text NOT NULL DEFAULT '#2E68FF',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Case-insensitive: a name can't be duplicated within one user's own list, but different
-- users may each have a category with the same name.
CREATE UNIQUE INDEX idx_categories_owner_name ON categories(owner_id, lower(name));

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_own" ON categories FOR ALL
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
