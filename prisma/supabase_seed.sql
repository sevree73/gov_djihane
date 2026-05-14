-- ============================================================
-- gov_djihane — Supabase Seed Data
-- Generated from prisma/seed.ts
-- ============================================================
-- Safe to re-run:
--   • Users  → ON CONFLICT (email) DO UPDATE (refreshes password hash)
--   • Projects → skipped when title already exists (mirrors seed.ts behaviour)
-- ============================================================
-- Paste this entire file into the Supabase SQL Editor and run it.
-- ============================================================

BEGIN;

-- ── Required extensions ───────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- provides crypt() and gen_salt()
CREATE EXTENSION IF NOT EXISTS postgis;   -- provides ST_MakePoint() / ST_SetSRID()


-- ============================================================
-- SECTION 1: Users  (6 rows)
-- ============================================================
-- Passwords are hashed with bcrypt (bf = Blowfish, cost 12).
-- The resulting $2a$12$... hashes are verified by bcryptjs on the server.
-- ON CONFLICT updates only the password so re-running is safe.
-- ============================================================

INSERT INTO "User" (
  id, email, name, phone, password, role,
  wilaya, ministere, "isActive", "createdAt", "updatedAt"
)
VALUES
  (
    gen_random_uuid(),
    'superadmin@gov.dz',
    'Karim Messaoudi',
    NULL,
    crypt('Admin1234!', gen_salt('bf', 12)),
    'SUPER_ADMIN',
    NULL, NULL, true, NOW(), NOW()
  ),
  (
    gen_random_uuid(),
    'ministere@gov.dz',
    'Fatima Ouali',
    NULL,
    crypt('Admin1234!', gen_salt('bf', 12)),
    'ADMIN_MINISTERE',
    NULL, 'Ministère de l''Intérieur', true, NOW(), NOW()
  ),
  (
    gen_random_uuid(),
    'wilaya16@gov.dz',
    'Yacine Hamdi',
    NULL,
    crypt('Admin1234!', gen_salt('bf', 12)),
    'ADMIN_WILAYA',
    'Alger', NULL, true, NOW(), NOW()
  ),
  (
    gen_random_uuid(),
    'gestionnaire@gov.dz',
    'Samira Boukhors',
    NULL,
    crypt('Admin1234!', gen_salt('bf', 12)),
    'GESTIONNAIRE_TERRITORIAL',
    'Alger', NULL, true, NOW(), NOW()
  ),
  (
    gen_random_uuid(),
    'agent@gov.dz',
    'Rachid Aït Yahia',
    NULL,
    crypt('Admin1234!', gen_salt('bf', 12)),
    'AGENT_TECHNIQUE',
    'Alger', NULL, true, NOW(), NOW()
  ),
  (
    gen_random_uuid(),
    'citoyen@test.dz',
    'Ahmed Benali',
    NULL,
    crypt('Citoyen1234!', gen_salt('bf', 12)),
    'CITOYEN',
    'Alger', NULL, true, NOW(), NOW()
  )
ON CONFLICT (email) DO UPDATE SET
  password    = EXCLUDED.password,
  "updatedAt" = NOW();


-- ============================================================
-- SECTION 2: Projects  (10 territorial PAW projects)
-- ============================================================
-- Each row is inserted only when no project with the same title exists,
-- exactly mirroring the seed.ts findFirst → skip / create logic.
-- The location column is a PostGIS geometry point (SRID 4326 = WGS 84).
-- createdById always references the superadmin inserted above.
-- ============================================================

INSERT INTO "Project" (
  id, title, description, sector,
  status, "advancementRate",
  wilaya, budget, "budgetSpent",
  "startDate", "endDate", location,
  "createdById", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  p.title,
  p.description,
  p.sector,
  p.status::"ProjectStatus",
  p.rate::INTEGER,
  p.wilaya,
  p.budget::DECIMAL(15, 2),
  NULL,                                                   -- budgetSpent not seeded
  p.start_date::TIMESTAMP(3),
  p.end_date::TIMESTAMP(3),
  ST_SetSRID(ST_MakePoint(p.lng::FLOAT8, p.lat::FLOAT8), 4326),
  (SELECT id FROM "User" WHERE email = 'superadmin@gov.dz'),
  NOW(),
  NOW()
FROM (VALUES

  -- ── Alger (4 projects) ─────────────────────────────────────────────────────

  (
    'Extension Ligne 1 du Métro d''Alger',
    'Prolongement de la ligne 1 du métro d''Alger de Haï El Badr jusqu''à l''aéroport Houari Boumediene, ajoutant 7 nouvelles stations sur 9 km de tracé souterrain.',
    'Transport', 'EN_COURS', 65, 'Alger',
    45000000000.00, '2022-03-01', '2025-12-31',
    3.0605, 36.7355
  ),
  (
    'Programme de Logements Sociaux — Bab Ezzouar',
    'Construction de 3 200 logements sociaux participatifs (LSP) à Bab Ezzouar, incluant commerces de proximité, écoles primaires et espaces verts communautaires.',
    'Urbanisme', 'EN_COURS', 42, 'Alger',
    12000000000.00, '2023-01-15', '2026-06-30',
    3.1820, 36.7242
  ),
  (
    'Station de Traitement des Eaux — Hamiz',
    'Réhabilitation et extension de la station de traitement des eaux potables du barrage Hamiz pour desservir 1,2 million d''habitants supplémentaires dans la banlieue est d''Alger.',
    'Eau', 'EN_COURS', 78, 'Alger',
    8500000000.00, '2021-06-01', '2024-12-31',
    3.2380, 36.6870
  ),
  (
    'Réhabilitation du Parc de Riadh El Feth',
    'Réaménagement complet du parc de Riadh El Feth : restauration des allées, installation de jeux pour enfants, éclairage solaire et rénovation des fontaines historiques.',
    'Environnement', 'EN_COURS', 30, 'Alger',
    850000000.00, '2024-02-01', '2025-09-30',
    3.0535, 36.7580
  ),

  -- ── Oran (3 projects) ──────────────────────────────────────────────────────

  (
    'Modernisation du Port Commercial d''Oran',
    'Extension et modernisation du port d''Oran avec construction d''un nouveau terminal à conteneurs, dragage du chenal d''accès et mise aux normes des équipements de manutention.',
    'Transport', 'EN_COURS', 55, 'Oran',
    38000000000.00, '2022-09-01', '2026-03-31',
    -0.6340, 35.7186
  ),
  (
    'Construction du CHU Ibn Rochd — Oran',
    'Construction d''un nouveau Centre Hospitalier Universitaire de 800 lits à Oran, doté d''un plateau technique de pointe incluant chirurgie cardiaque, oncologie et imagerie médicale avancée.',
    'Santé', 'EN_ATTENTE', 12, 'Oran',
    15000000000.00, '2025-01-01', '2028-12-31',
    -0.6250, 35.6888
  ),
  (
    'Zone Touristique de Canastel — Oran',
    'Aménagement d''une zone touristique intégrée à Canastel : marina, complexe hôtelier 5 étoiles, front de mer piétonnier et infrastructure nautique pour développer le tourisme balnéaire.',
    'Tourisme', 'EN_COURS', 48, 'Oran',
    5200000000.00, '2023-04-01', '2025-12-31',
    -0.5875, 35.7025
  ),

  -- ── Constantine (3 projects) ───────────────────────────────────────────────

  (
    'Restauration des Ponts Suspendus de Constantine',
    'Réfection structurelle et mise en valeur patrimoniale des ponts suspendus emblématiques de Constantine, notamment le pont Sidi M''Cid, classé monument historique national.',
    'Voirie', 'EN_COURS', 82, 'Constantine',
    9800000000.00, '2021-03-01', '2024-06-30',
    6.6147, 36.3650
  ),
  (
    'Zone Industrielle Ahmed Hamidou — Extension',
    'Extension de 240 hectares de la zone industrielle Ahmed Hamidou à Constantine, avec viabilisation complète, réseau énergétique haute tension et plateforme logistique multimodale.',
    'Industrie', 'TERMINE', 100, 'Constantine',
    22500000000.00, '2019-01-01', '2023-12-31',
    6.5987, 36.3420
  ),
  (
    'Centrale Électrique à Gaz — Aïn Smara',
    'Construction d''une centrale électrique à cycle combiné gaz de 1 200 MW à Aïn Smara pour renforcer la capacité de production nationale et sécuriser l''alimentation électrique du nord-est algérien.',
    'Énergie', 'EN_COURS', 58, 'Constantine',
    67000000000.00, '2022-06-01', '2026-06-30',
    6.7820, 36.1875
  )

) AS p(title, description, sector, status, rate, wilaya, budget, start_date, end_date, lng, lat)
WHERE NOT EXISTS (
  SELECT 1 FROM "Project" existing WHERE existing.title = p.title
);


COMMIT;


-- ============================================================
-- VERIFICATION  (run after the block above commits)
-- ============================================================
-- hash_prefix should show '$2a$12' for every row.
-- isActive must be true for admin logins to succeed.
-- geo should show '✓ coords set' for all 10 projects.
-- ============================================================

-- Users
SELECT
  email,
  role,
  wilaya,
  "isActive",
  LEFT(password, 7) AS hash_prefix   -- correct: '$2a$12' | wrong: 'Admin123'
FROM "User"
ORDER BY
  CASE role
    WHEN 'SUPER_ADMIN'              THEN 1
    WHEN 'ADMIN_MINISTERE'          THEN 2
    WHEN 'ADMIN_WILAYA'             THEN 3
    WHEN 'GESTIONNAIRE_TERRITORIAL' THEN 4
    WHEN 'AGENT_TECHNIQUE'          THEN 5
    ELSE                                 6
  END;

-- Projects
SELECT
  title,
  wilaya,
  status,
  "advancementRate"                                              AS pct,
  CASE WHEN location IS NOT NULL THEN '✓ coords set'
                                 ELSE '✗ missing coords' END    AS geo
FROM "Project"
ORDER BY wilaya, title;
