ALTER TABLE service_instance
  ADD COLUMN IF NOT EXISTS execution_status TEXT NOT NULL DEFAULT 'not_started';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'service_instance_execution_status_check'
      AND conrelid = 'service_instance'::regclass
  ) THEN
    ALTER TABLE service_instance
      ADD CONSTRAINT service_instance_execution_status_check
      CHECK (execution_status IN ('not_started', 'in_progress'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS service_instance_execution_scope_idx
  ON service_instance (tenant_id, school_id, execution_status, operational_date, id);
