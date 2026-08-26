-- Slice 13.12 Online Student Pickup. Append-only event plus current projection.
CREATE TABLE IF NOT EXISTS transport_event (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE RESTRICT,
  school_id UUID NOT NULL,
  service_instance_id UUID NOT NULL,
  student_id UUID NOT NULL,
  actor_id UUID NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  actor_role TEXT NOT NULL CHECK (actor_role = 'driver'),
  event_type TEXT NOT NULL CHECK (event_type = 'pickup'),
  client_event_id UUID NOT NULL,
  fingerprint TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  state_version INTEGER NOT NULL CHECK (state_version >= 1),
  CONSTRAINT transport_event_instance_scope FOREIGN KEY (service_instance_id, tenant_id, school_id)
    REFERENCES service_instance(id, tenant_id, school_id) ON DELETE RESTRICT,
  CONSTRAINT transport_event_student_scope FOREIGN KEY (student_id, tenant_id)
    REFERENCES student(id, tenant_id) ON DELETE RESTRICT,
  CONSTRAINT transport_event_client_identity_unique UNIQUE (tenant_id, client_event_id)
);
CREATE INDEX IF NOT EXISTS transport_event_student_scope_idx
  ON transport_event (tenant_id, service_instance_id, student_id, recorded_at);

CREATE TABLE IF NOT EXISTS student_transport_current_state (
  tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE RESTRICT,
  school_id UUID NOT NULL,
  service_instance_id UUID NOT NULL,
  student_id UUID NOT NULL,
  pickup_state TEXT NOT NULL DEFAULT 'not_picked_up' CHECK (pickup_state IN ('not_picked_up', 'picked_up')),
  last_event_id UUID NULL REFERENCES transport_event(id) ON DELETE RESTRICT,
  version INTEGER NOT NULL DEFAULT 0 CHECK (version >= 0),
  committed_at TIMESTAMPTZ NULL,
  CONSTRAINT student_transport_state_pk PRIMARY KEY (tenant_id, service_instance_id, student_id),
  CONSTRAINT student_transport_state_instance_scope FOREIGN KEY (service_instance_id, tenant_id, school_id)
    REFERENCES service_instance(id, tenant_id, school_id) ON DELETE RESTRICT,
  CONSTRAINT student_transport_state_student_scope FOREIGN KEY (student_id, tenant_id)
    REFERENCES student(id, tenant_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS student_transport_state_school_idx
  ON student_transport_current_state (tenant_id, school_id, service_instance_id, student_id);
