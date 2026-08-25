-- Slice 13.09: recurring transport-service definition only.
-- Dated executions, assignments, stops and transport events are intentionally out of scope.
CREATE UNIQUE INDEX IF NOT EXISTS route_scope_key ON route (id, tenant_id, school_id);
CREATE UNIQUE INDEX IF NOT EXISTS route_tenant_school_id_key ON route (tenant_id, school_id, id);

CREATE TABLE IF NOT EXISTS transport_service (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE RESTRICT,
  school_id UUID NOT NULL REFERENCES school(id) ON DELETE RESTRICT,
  route_id UUID NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT transport_service_name_not_blank CHECK (char_length(btrim(name)) BETWEEN 1 AND 200),
  CONSTRAINT transport_service_school_tenant_match FOREIGN KEY (school_id, tenant_id) REFERENCES school (id, tenant_id) ON DELETE RESTRICT,
  CONSTRAINT transport_service_route_scope_match FOREIGN KEY (tenant_id, school_id, route_id) REFERENCES route (tenant_id, school_id, id) ON DELETE RESTRICT,
  CONSTRAINT transport_service_school_name_unique UNIQUE (school_id, name)
);

CREATE INDEX IF NOT EXISTS transport_service_school_status_idx ON transport_service (school_id, status, id);
CREATE INDEX IF NOT EXISTS transport_service_route_idx ON transport_service (route_id, status, id);
