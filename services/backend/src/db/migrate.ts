import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { Pool } from 'pg';

export async function runMigrations(pool: Pick<Pool, 'query' | 'connect'>): Promise<void> {
  await pool.query('CREATE TABLE IF NOT EXISTS _schema_migrations (version TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
  const directory = join(dirname(fileURLToPath(import.meta.url)), 'migrations');
  const files = (await readdir(directory)).filter((file) => file.endsWith('.sql')).sort();
  for (const file of files) {
    const version = file.slice(0, file.indexOf('.'));
    const sql = await readFile(join(directory, file), 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const applied = await pool.query<{ checksum: string }>('SELECT checksum FROM _schema_migrations WHERE version = $1', [version]);
    if (applied.rows[0]) { if (applied.rows[0].checksum !== checksum) throw new Error('MIGRATION_CHECKSUM_MISMATCH'); continue; }
    const client = await pool.connect();
    try { await client.query('BEGIN'); await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['school_service:migrations']); await client.query(sql); await client.query('INSERT INTO _schema_migrations (version, checksum) VALUES ($1, $2)', [version, checksum]); await client.query('COMMIT'); }
    catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL_REQUIRED');
  const pool = new Pool({ connectionString });
  try { await runMigrations(pool); } finally { await pool.end(); }
}

if (process.argv[1]?.endsWith('migrate.ts')) void main();
