import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const PROJECTS = [
  // --- Alger ---
  {
    title: "Extension Ligne 1 du Métro d'Alger",
    description: "Prolongement de la ligne 1 du métro d'Alger de Haï El Badr jusqu'à l'aéroport Houari Boumediene, ajoutant 7 nouvelles stations sur 9 km de tracé souterrain.",
    sector: 'Transport',
    status: 'EN_COURS' as const,
    advancementRate: 65,
    wilaya: 'Alger',
    budget: 45_000_000_000,
    startDate: new Date('2022-03-01'),
    endDate: new Date('2025-12-31'),
    lng: 3.0605, lat: 36.7355,
  },
  {
    title: 'Programme de Logements Sociaux — Bab Ezzouar',
    description: "Construction de 3 200 logements sociaux participatifs (LSP) à Bab Ezzouar, incluant commerces de proximité, écoles primaires et espaces verts communautaires.",
    sector: 'Urbanisme',
    status: 'EN_COURS' as const,
    advancementRate: 42,
    wilaya: 'Alger',
    budget: 12_000_000_000,
    startDate: new Date('2023-01-15'),
    endDate: new Date('2026-06-30'),
    lng: 3.1820, lat: 36.7242,
  },
  {
    title: 'Station de Traitement des Eaux — Hamiz',
    description: "Réhabilitation et extension de la station de traitement des eaux potables du barrage Hamiz pour desservir 1,2 million d'habitants supplémentaires dans la banlieue est d'Alger.",
    sector: 'Eau',
    status: 'EN_COURS' as const,
    advancementRate: 78,
    wilaya: 'Alger',
    budget: 8_500_000_000,
    startDate: new Date('2021-06-01'),
    endDate: new Date('2024-12-31'),
    lng: 3.2380, lat: 36.6870,
  },
  {
    title: 'Réhabilitation du Parc de Riadh El Feth',
    description: "Réaménagement complet du parc de Riadh El Feth : restauration des allées, installation de jeux pour enfants, éclairage solaire et rénovation des fontaines historiques.",
    sector: 'Environnement',
    status: 'EN_COURS' as const,
    advancementRate: 30,
    wilaya: 'Alger',
    budget: 850_000_000,
    startDate: new Date('2024-02-01'),
    endDate: new Date('2025-09-30'),
    lng: 3.0535, lat: 36.7580,
  },
  // --- Oran ---
  {
    title: "Modernisation du Port Commercial d'Oran",
    description: "Extension et modernisation du port d'Oran avec construction d'un nouveau terminal à conteneurs, dragage du chenal d'accès et mise aux normes des équipements de manutention.",
    sector: 'Transport',
    status: 'EN_COURS' as const,
    advancementRate: 55,
    wilaya: 'Oran',
    budget: 38_000_000_000,
    startDate: new Date('2022-09-01'),
    endDate: new Date('2026-03-31'),
    lng: -0.6340, lat: 35.7186,
  },
  {
    title: 'Construction du CHU Ibn Rochd — Oran',
    description: "Construction d'un nouveau Centre Hospitalier Universitaire de 800 lits à Oran, doté d'un plateau technique de pointe incluant chirurgie cardiaque, oncologie et imagerie médicale avancée.",
    sector: 'Santé',
    status: 'EN_ATTENTE' as const,
    advancementRate: 12,
    wilaya: 'Oran',
    budget: 15_000_000_000,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2028-12-31'),
    lng: -0.6250, lat: 35.6888,
  },
  {
    title: 'Zone Touristique de Canastel — Oran',
    description: "Aménagement d'une zone touristique intégrée à Canastel : marina, complexe hôtelier 5 étoiles, front de mer piétonnier et infrastructure nautique pour développer le tourisme balnéaire.",
    sector: 'Tourisme',
    status: 'EN_COURS' as const,
    advancementRate: 48,
    wilaya: 'Oran',
    budget: 5_200_000_000,
    startDate: new Date('2023-04-01'),
    endDate: new Date('2025-12-31'),
    lng: -0.5875, lat: 35.7025,
  },
  // --- Constantine ---
  {
    title: 'Restauration des Ponts Suspendus de Constantine',
    description: "Réfection structurelle et mise en valeur patrimoniale des ponts suspendus emblématiques de Constantine, notamment le pont Sidi M'Cid, classé monument historique national.",
    sector: 'Voirie',
    status: 'EN_COURS' as const,
    advancementRate: 82,
    wilaya: 'Constantine',
    budget: 9_800_000_000,
    startDate: new Date('2021-03-01'),
    endDate: new Date('2024-06-30'),
    lng: 6.6147, lat: 36.3650,
  },
  {
    title: 'Zone Industrielle Ahmed Hamidou — Extension',
    description: "Extension de 240 hectares de la zone industrielle Ahmed Hamidou à Constantine, avec viabilisation complète, réseau énergétique haute tension et plateforme logistique multimodale.",
    sector: 'Industrie',
    status: 'TERMINE' as const,
    advancementRate: 100,
    wilaya: 'Constantine',
    budget: 22_500_000_000,
    startDate: new Date('2019-01-01'),
    endDate: new Date('2023-12-31'),
    lng: 6.5987, lat: 36.3420,
  },
  {
    title: 'Centrale Électrique à Gaz — Aïn Smara',
    description: "Construction d'une centrale électrique à cycle combiné gaz de 1 200 MW à Aïn Smara pour renforcer la capacité de production nationale et sécuriser l'alimentation électrique du nord-est algérien.",
    sector: 'Énergie',
    status: 'EN_COURS' as const,
    advancementRate: 58,
    wilaya: 'Constantine',
    budget: 67_000_000_000,
    startDate: new Date('2022-06-01'),
    endDate: new Date('2026-06-30'),
    lng: 6.7820, lat: 36.1875,
  },
]

async function main() {
  console.log('🌱  Seeding test users…')

  const SALT_ROUNDS = 12

  const users = [
    {
      email: 'citoyen@test.dz',
      name: 'Ahmed Benali',
      password: await bcrypt.hash('Citoyen1234!', SALT_ROUNDS),
      role: 'CITOYEN' as const,
      wilaya: 'Alger',
    },
    {
      email: 'superadmin@gov.dz',
      name: 'Karim Messaoudi',
      password: await bcrypt.hash('Admin1234!', SALT_ROUNDS),
      role: 'SUPER_ADMIN' as const,
    },
    {
      email: 'ministere@gov.dz',
      name: 'Fatima Ouali',
      password: await bcrypt.hash('Admin1234!', SALT_ROUNDS),
      role: 'ADMIN_MINISTERE' as const,
      ministere: "Ministère de l'Intérieur",
    },
    {
      email: 'wilaya16@gov.dz',
      name: 'Yacine Hamdi',
      password: await bcrypt.hash('Admin1234!', SALT_ROUNDS),
      role: 'ADMIN_WILAYA' as const,
      wilaya: 'Alger',
    },
    {
      email: 'gestionnaire@gov.dz',
      name: 'Samira Boukhors',
      password: await bcrypt.hash('Admin1234!', SALT_ROUNDS),
      role: 'GESTIONNAIRE_TERRITORIAL' as const,
      wilaya: 'Alger',
    },
    {
      email: 'agent@gov.dz',
      name: 'Rachid Aït Yahia',
      password: await bcrypt.hash('Admin1234!', SALT_ROUNDS),
      role: 'AGENT_TECHNIQUE' as const,
      wilaya: 'Alger',
    },
  ]

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { password: u.password },
      create: u,
    })
    console.log(`  ✓ ${user.role.padEnd(24)} ${user.email}`)
  }

  // Get superadmin ID to use as project creator
  const superAdmin = await prisma.user.findUnique({
    where: { email: 'superadmin@gov.dz' },
    select: { id: true },
  })
  if (!superAdmin) throw new Error('Superadmin not found after upsert')

  console.log('\n🏗️  Seeding projects…')

  for (const p of PROJECTS) {
    // Check if project already exists by title to allow re-runs
    const existing = await prisma.project.findFirst({ where: { title: p.title } })
    if (existing) {
      console.log(`  ↩ skipped (exists)  ${p.title}`)
      continue
    }

    const project = await prisma.project.create({
      data: {
        title: p.title,
        description: p.description,
        sector: p.sector,
        status: p.status,
        advancementRate: p.advancementRate,
        wilaya: p.wilaya,
        budget: p.budget,
        startDate: p.startDate,
        endDate: p.endDate,
        createdById: superAdmin.id,
      },
    })

    // Set PostGIS location separately (Unsupported field)
    await prisma.$executeRawUnsafe(
      `UPDATE "Project" SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
      p.lng,
      p.lat,
      project.id,
    )

    console.log(`  ✓ [${p.wilaya.padEnd(12)}] ${p.title}`)
  }

  console.log('\n✅  Seed complete.\n')
  console.log('Test credentials:')
  console.log('  Citoyen      →  citoyen@test.dz       / Citoyen1234!')
  console.log('  Super Admin  →  superadmin@gov.dz     / Admin1234!')
  console.log('  Ministère    →  ministere@gov.dz      / Admin1234!')
  console.log('  Wilaya 16    →  wilaya16@gov.dz       / Admin1234!')
  console.log('  Gestionnaire →  gestionnaire@gov.dz   / Admin1234!')
  console.log('  Agent        →  agent@gov.dz          / Admin1234!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
