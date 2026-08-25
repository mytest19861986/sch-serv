CREATE TABLE IF NOT EXISTS student (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE RESTRICT,
  school_id UUID NOT NULL REFERENCES school(id) ON DELETE RESTRICT,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT student_display_name_not_blank CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 200)
);
CREATE INDEX IF NOT EXISTS student_school_status_idx ON student (school_id, status, id);
CREATE INDEX IF NOT EXISTS student_tenant_school_idx ON student (tenant_id, school_id, id);
CREATE UNIQUE INDEX IF NOT EXISTS school_id_tenant_unique_idx ON school (id, tenant_id);
ALTER TABLE student DROP CONSTRAINT IF EXISTS student_school_tenant_match;
ALTER TABLE student ADD CONSTRAINT student_school_tenant_match FOREIGN KEY (school_id, tenant_id) REFERENCES school (id, tenant_id) ON DELETE RESTRICT;
