CREATE TABLE IF NOT EXISTS driver_profile (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT driver_profile_tenant_user_unique UNIQUE (tenant_id, user_id)
);
CREATE INDEX IF NOT EXISTS driver_profile_tenant_status_idx ON driver_profile (tenant_id, status, id);
CREATE UNIQUE INDEX IF NOT EXISTS driver_profile_id_tenant_unique_idx ON driver_profile (id, tenant_id);
