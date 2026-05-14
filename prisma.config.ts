import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // DIRECT_URL = Supabase direct connection (port 5432) — bypasses pooler for CLI migrations.
    // Falls back to DATABASE_URL for local dev where there is no pooler.
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
