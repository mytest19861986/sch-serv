CREATE TABLE IF NOT EXISTS audit_record (
  id UUID PRIMARY KEY,
  tenant_id UUID NULL,
  actor_id TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  outcome TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_record_tenant_time_idx ON audit_record (tenant_id, created_at, id);

CREATE OR REPLACE FUNCTION prevent_audit_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'AUDIT_APPEND_ONLY';
END;
$$;

DROP TRIGGER IF EXISTS audit_record_append_only ON audit_record;
CREATE TRIGGER audit_record_append_only BEFORE UPDATE OR DELETE ON audit_record FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();
