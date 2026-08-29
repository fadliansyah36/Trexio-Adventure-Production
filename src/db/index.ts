import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  // eslint-disable-next-line no-var
  var _postgresPool: Pool | undefined;
}

// Supabase-ready pool. Prefer DATABASE_URL (with SSL); fallback to discrete SQL_* vars.
export const createPool = () => {
  if (!global._postgresPool) {
    const databaseUrl = process.env.DATABASE_URL || '';
    const useSSL =
      !!databaseUrl ||
      process.env.SQL_SSL === 'true' ||
      process.env.PGSSLMODE === 'require';
    const ssl = useSSL ? { rejectUnauthorized: false } : false;

    global._postgresPool = databaseUrl
      ? new Pool({
          connectionString: databaseUrl,
          ssl,
          max: parseInt(process.env.SQL_POOL_MAX || '10'),
          connectionTimeoutMillis: 15000,
        })
      : new Pool({
          host: process.env.SQL_HOST,
          port: parseInt(process.env.SQL_PORT || '5432'),
          user: process.env.SQL_USER,
          password: process.env.SQL_PASSWORD,
          database: process.env.SQL_DB_NAME,
          ssl,
          max: parseInt(process.env.SQL_POOL_MAX || '10'),
          connectionTimeoutMillis: 15000,
        });

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
