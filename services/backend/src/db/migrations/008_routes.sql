CREATE TABLE IF NOT EXISTS route (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE RESTRICT,
  school_id UUID NOT NULL REFERENCES school(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT route_name_not_blank CHECK (char_length(btrim(name)) BETWEEN 1 AND 200),
  CONSTRAINT route_school_tenant_match FOREIGN KEY (school_id, tenant_id) REFERENCES school (id, tenant_id) ON DELETE RESTRICT,
  CONSTRAINT route_school_name_unique UNIQUE (school_id, name)
);
CREATE INDEX IF NOT EXISTS route_school_status_idx ON route (school_id, status, id);
CREATE INDEX IF NOT EXISTS route_tenant_school_idx ON route (tenant_id, school_id, id);
