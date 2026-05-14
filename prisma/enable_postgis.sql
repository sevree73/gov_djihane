-- Run this once against a fresh database before `prisma migrate dev`.
-- The postgis/postgis Docker image runs this automatically on first container start,
-- but it is needed again if the public schema is ever dropped and recreated.
CREATE EXTENSION IF NOT EXISTS postgis;
