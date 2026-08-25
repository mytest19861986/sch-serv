CREATE TABLE IF NOT EXISTS guardian (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT guardian_tenant_user_unique UNIQUE (tenant_id, user_id)
);
CREATE INDEX IF NOT EXISTS guardian_tenant_status_idx ON guardian (tenant_id, status, id);
CREATE UNIQUE INDEX IF NOT EXISTS guardian_id_tenant_unique_idx ON guardian (id, tenant_id);
CREATE TABLE IF NOT EXISTS student_guardian_relationship (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE RESTRICT,
  school_id UUID NOT NULL,
  student_id UUID NOT NULL REFERENCES student(id) ON DELETE RESTRICT,
  guardian_id UUID NOT NULL REFERENCES guardian(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT relationship_unique UNIQUE (id)
);
CREATE INDEX IF NOT EXISTS relationship_guardian_status_idx ON student_guardian_relationship (guardian_id, status, student_id);
CREATE INDEX IF NOT EXISTS relationship_student_status_idx ON student_guardian_relationship (student_id, status, guardian_id);
DROP INDEX IF EXISTS relationship_active_unique_idx;
ALTER TABLE student_guardian_relationship DROP CONSTRAINT IF EXISTS relationship_unique;
CREATE UNIQUE INDEX relationship_active_unique_idx ON student_guardian_relationship (student_id, guardian_id) WHERE status = 'active';
CREATE UNIQUE INDEX IF NOT EXISTS student_id_tenant_unique_idx ON student (id, tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS guardian_school_tenant_unique_idx ON school (id, tenant_id);
ALTER TABLE student_guardian_relationship DROP CONSTRAINT IF EXISTS relationship_school_tenant_match;
ALTER TABLE student_guardian_relationship ADD CONSTRAINT relationship_school_tenant_match FOREIGN KEY (school_id, tenant_id) REFERENCES school (id, tenant_id) ON DELETE RESTRICT;
ALTER TABLE student_guardian_relationship DROP CONSTRAINT IF EXISTS relationship_student_tenant_match;
ALTER TABLE student_guardian_relationship ADD CONSTRAINT relationship_student_tenant_match FOREIGN KEY (student_id, tenant_id) REFERENCES student (id, tenant_id) ON DELETE RESTRICT;
ALTER TABLE student_guardian_relationship DROP CONSTRAINT IF EXISTS relationship_guardian_tenant_match;
ALTER TABLE student_guardian_relationship ADD CONSTRAINT relationship_guardian_tenant_match FOREIGN KEY (guardian_id, tenant_id) REFERENCES guardian (id, tenant_id) ON DELETE RESTRICT;
