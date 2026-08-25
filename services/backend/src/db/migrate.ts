import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';

export async function runMigrations(pool: Pick<Pool, 'query' | 'connect'>): Promise<void> {
  await pool.query('CREATE TABLE IF NOT EXISTS _schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
  const directory = join(dirname(fileURLToPath(import.meta.url)), 'migrations');
  const files = (await readdir(directory)).filter((file) => file.endsWith('.sql')).sort();
  for (const file of files) {
    const version = file.slice(0, file.indexOf('.'));
    const applied = await pool.query('SELECT 1 FROM _schema_migrations WHERE version = $1', [version]);
    if (applied.rowCount) continue;
    const sql = await readFile(join(directory, file), 'utf8');
    const client = await pool.connect();
    try { await client.query('BEGIN'); await client.query(sql); await client.query('INSERT INTO _schema_migrations (version) VALUES ($1)', [version]); await client.query('COMMIT'); }
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
