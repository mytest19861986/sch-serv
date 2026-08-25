-- Slice 13.10 support context: a dated service execution is only a referenced
-- aggregate here. No execution, pickup/drop-off, offline or notification API is
-- introduced by this migration.
CREATE UNIQUE INDEX IF NOT EXISTS transport_service_id_scope_unique_idx ON transport_service (id, tenant_id, school_id);
CREATE UNIQUE INDEX IF NOT EXISTS student_id_tenant_unique_idx ON student (id, tenant_id);
CREATE TABLE IF NOT EXISTS service_instance (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE RESTRICT,
  school_id UUID NOT NULL,
  service_id UUID NOT NULL,
  operational_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT service_instance_school_tenant_match FOREIGN KEY (school_id, tenant_id) REFERENCES school(id, tenant_id) ON DELETE RESTRICT,
  CONSTRAINT service_instance_service_scope_match FOREIGN KEY (service_id, tenant_id, school_id) REFERENCES transport_service(id, tenant_id, school_id) ON DELETE RESTRICT,
  CONSTRAINT service_instance_service_date_unique UNIQUE (service_id, operational_date),
  CONSTRAINT service_instance_id_scope_unique UNIQUE (id, tenant_id, school_id)
);
CREATE INDEX IF NOT EXISTS service_instance_scope_status_idx ON service_instance (tenant_id, school_id, status, operational_date, id);

CREATE TABLE IF NOT EXISTS driver_service_assignment (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE RESTRICT,
  school_id UUID NOT NULL,
  service_instance_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT driver_assignment_instance_scope FOREIGN KEY (service_instance_id, tenant_id, school_id) REFERENCES service_instance(id, tenant_id, school_id) ON DELETE RESTRICT,
  CONSTRAINT driver_assignment_driver_scope FOREIGN KEY (driver_id, tenant_id) REFERENCES driver_profile(id, tenant_id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX IF NOT EXISTS driver_assignment_active_unique ON driver_service_assignment(service_instance_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS driver_assignment_driver_status_idx ON driver_service_assignment(tenant_id, driver_id, status, service_instance_id);

CREATE TABLE IF NOT EXISTS vehicle_service_assignment (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE RESTRICT,
  school_id UUID NOT NULL,
  service_instance_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT vehicle_assignment_instance_scope FOREIGN KEY (service_instance_id, tenant_id, school_id) REFERENCES service_instance(id, tenant_id, school_id) ON DELETE RESTRICT,
  CONSTRAINT vehicle_assignment_vehicle_scope FOREIGN KEY (vehicle_id, tenant_id) REFERENCES vehicle(id, tenant_id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX IF NOT EXISTS vehicle_assignment_active_unique ON vehicle_service_assignment(service_instance_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS vehicle_assignment_vehicle_status_idx ON vehicle_service_assignment(tenant_id, vehicle_id, status, service_instance_id);

CREATE TABLE IF NOT EXISTS student_service_assignment (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE RESTRICT,
  school_id UUID NOT NULL,
  service_instance_id UUID NOT NULL,
  student_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT student_assignment_instance_scope FOREIGN KEY (service_instance_id, tenant_id, school_id) REFERENCES service_instance(id, tenant_id, school_id) ON DELETE RESTRICT,
  CONSTRAINT student_assignment_student_scope FOREIGN KEY (student_id, tenant_id) REFERENCES student(id, tenant_id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX IF NOT EXISTS student_assignment_active_unique ON student_service_assignment(service_instance_id, student_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS student_assignment_student_status_idx ON student_service_assignment(tenant_id, student_id, status, service_instance_id);
