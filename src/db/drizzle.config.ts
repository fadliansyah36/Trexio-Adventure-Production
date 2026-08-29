import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

// Supabase (or any Postgres) — prefer a single connection string (DATABASE_URL).
// Fallback to discrete SQL_* variables for self-managed instances.
const databaseUrl = process.env.DATABASE_URL;

const config = databaseUrl
  ? {
      url: databaseUrl,
      ssl: { rejectUnauthorized: false as const },
    }
  : (() => {
      const host = process.env.SQL_HOST;
      const database = process.env.SQL_DB_NAME;
      const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER;
      const password = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD;
      if (!host || !database || !user || !password) {
        throw new Error(
          "Set DATABASE_URL (Supabase) or SQL_HOST/SQL_DB_NAME/SQL_(ADMIN_)USER/SQL_(ADMIN_)PASSWORD."
        );
      }
      return {
        host,
        database,
        user,
        password,
        ssl:
          process.env.SQL_SSL === "true"
            ? { rejectUnauthorized: false as const }
            : false,
      };
    })();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: config as any,
  verbose: true,
});
