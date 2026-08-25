CREATE TABLE IF NOT EXISTS "user" (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_email_valid CHECK (position('@' IN email) > 1),
  CONSTRAINT user_display_name_not_blank CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 200)
);
CREATE TABLE IF NOT EXISTS tenant_membership (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tenant_membership_user_tenant_unique UNIQUE (user_id, tenant_id)
);
CREATE INDEX IF NOT EXISTS tenant_membership_tenant_status_idx ON tenant_membership (tenant_id, status, user_id);
CREATE TABLE IF NOT EXISTS role_assignment (
  id UUID PRIMARY KEY,
  membership_id UUID NOT NULL REFERENCES tenant_membership(id) ON DELETE RESTRICT,
  role TEXT NOT NULL CHECK (role IN ('super-admin', 'school-admin', 'school-operator', 'driver', 'parent')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT role_assignment_membership_role_unique UNIQUE (membership_id, role)
);
CREATE INDEX IF NOT EXISTS role_assignment_membership_status_idx ON role_assignment (membership_id, status, role);
