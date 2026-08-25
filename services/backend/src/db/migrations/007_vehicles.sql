CREATE TABLE IF NOT EXISTS vehicle (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE RESTRICT,
  identifier TEXT NOT NULL CHECK (char_length(identifier) BETWEEN 1 AND 120),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT vehicle_tenant_identifier_unique UNIQUE (tenant_id, identifier)
);
CREATE INDEX IF NOT EXISTS vehicle_tenant_status_idx ON vehicle (tenant_id, status, id);
CREATE UNIQUE INDEX IF NOT EXISTS vehicle_id_tenant_unique_idx ON vehicle (id, tenant_id);
