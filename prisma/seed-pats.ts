import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // ── Ensure superadmin exists ───────────────────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@gov.dz' },
    update: {},
    create: {
      email: 'superadmin@gov.dz',
      name: 'Karim Messaoudi',
      password: await bcrypt.hash('Admin1234!', 12),
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  })

  // ── Citoyen for signalements ───────────────────────────────────────────────
  const citoyen = await prisma.user.upsert({
    where: { email: 'citoyen@test.dz' },
    update: {},
    create: {
      email: 'citoyen@test.dz',
      name: 'Ahmed Benali',
      password: await bcrypt.hash('Citoyen1234!', 12),
      role: 'CITOYEN',
      wilaya: 'Timimoun',
      isActive: true,
    },
  })

  // ── PAW (Project) for Timimoun ─────────────────────────────────────────────
  console.log('\n🏗️  Creating Timimoun PAW…')

  let timimounPAW = await prisma.project.findFirst({
    where: { wilaya: 'Timimoun', title: { contains: 'Timimoun' } },
  })

  if (!timimounPAW) {
    timimounPAW = await prisma.project.create({
      data: {
        title: 'PAW — Wilaya de Timimoun 2024-2027',
        description:
          'Plan d\'Aménagement de la Wilaya de Timimoun pour la période 2024-2027. Ce programme intègre le développement des infrastructures de base, la valorisation du patrimoine oasien, le désenclavement des communes isolées et le renforcement des services publics pour les 60 000 habitants de la wilaya.',
        sector: 'Urbanisme',
        status: 'EN_COURS',
        priority: 'HAUTE',
        wilaya: 'Timimoun',
        advancementRate: 52,
        budget: 18_500_000_000,
        budgetSpent: 9_620_000_000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2027-12-31'),
        createdById: superAdmin.id,
      },
    })
    console.log(`  ✓ Created PAW: ${timimounPAW.title}`)
  } else {
    console.log(`  ↩ PAW already exists: ${timimounPAW.title}`)
  }

  // Also add a second project so the map isn't empty
  let oranPAW = await prisma.project.findFirst({
    where: { wilaya: 'Oran', title: { contains: 'Sainte' } },
  })
  if (!oranPAW) {
    oranPAW = await prisma.project.create({
      data: {
        title: 'Réhabilitation du quartier de Sainte Clotilde — Oran',
        description: 'Programme de rénovation urbaine du quartier historique de Sainte Clotilde à Oran : réhabilitation des façades, mise aux normes des réseaux d\'eau et électricité, aménagement d\'espaces verts.',
        sector: 'Urbanisme',
        status: 'EN_COURS',
        priority: 'NORMALE',
        wilaya: 'Oran',
        advancementRate: 38,
        budget: 3_200_000_000,
        startDate: new Date('2023-09-01'),
        endDate: new Date('2026-06-30'),
        createdById: superAdmin.id,
      },
    })
    console.log(`  ✓ Created Oran PAW`)
  }

  // ── PATs for Timimoun ──────────────────────────────────────────────────────
  console.log('\n📋  Creating PATs…')

  const patDefs = [
    {
      name: 'Réseau d\'Eau Potable',
      avancement: 75,
      lat: 29.2621, lng: 0.2278,
      actions: [
        { text: 'Pose de canalisation principale (DN 400) — tronçon nord', status: 'DONE' as const, deadline: new Date('2024-06-30') },
        { text: 'Réhabilitation du château d\'eau de Timimoun-centre', status: 'DONE' as const, deadline: new Date('2024-09-15') },
        { text: 'Extension réseau vers Ouled Saïd', status: 'DONE' as const, deadline: new Date('2024-12-31') },
        { text: 'Installation des compteurs intelligents — phase 1', status: 'EN_COURS' as const, deadline: new Date('2025-06-30') },
        { text: 'Raccordement des douars périphériques', status: 'RETARD' as const, deadline: new Date('2025-03-31') },
      ],
    },
    {
      name: 'Voirie et Désenclavement',
      avancement: 45,
      lat: 29.2450, lng: 0.2450,
      actions: [
        { text: 'Revêtement bitumineux RN51 — tronçon Timimoun/Charouine (42 km)', status: 'DONE' as const, deadline: new Date('2024-08-31') },
        { text: 'Construction du pont oued Saoura', status: 'DONE' as const, deadline: new Date('2024-11-30') },
        { text: 'Piste de désenclavement vers Kali (18 km)', status: 'EN_COURS' as const, deadline: new Date('2025-06-30') },
        { text: 'Réfection voirie urbaine — Timimoun centre', status: 'EN_COURS' as const, deadline: new Date('2025-04-30') },
        { text: 'Signalisation routière et glissières de sécurité', status: 'RETARD' as const, deadline: new Date('2025-01-31') },
        { text: 'Piste vers Ouled Aïssa (25 km)', status: 'RETARD' as const, deadline: new Date('2025-02-28') },
      ],
    },
    {
      name: 'Infrastructure Scolaire',
      avancement: 90,
      lat: 29.2680, lng: 0.2200,
      actions: [
        { text: 'Construction CEM Timimoun-Est (600 places)', status: 'DONE' as const, deadline: new Date('2024-09-01') },
        { text: 'Réhabilitation école primaire Aoulef', status: 'DONE' as const, deadline: new Date('2024-07-15') },
        { text: 'Internat lycée Timimoun — extension 120 lits', status: 'DONE' as const, deadline: new Date('2024-10-31') },
        { text: 'Équipement informatique et laboratoires (5 établissements)', status: 'DONE' as const, deadline: new Date('2025-01-31') },
      ],
    },
    {
      name: 'Tourisme et Patrimoine Oasien',
      avancement: 22,
      lat: 29.2580, lng: 0.2350,
      actions: [
        { text: 'Restauration du ksar de Timimoun (tranche 1)', status: 'DONE' as const, deadline: new Date('2024-12-31') },
        { text: 'Aménagement du circuit touristique oasien', status: 'EN_COURS' as const, deadline: new Date('2025-09-30') },
        { text: 'Construction du musée de la Gourara', status: 'RETARD' as const, deadline: new Date('2025-03-31') },
        { text: 'Rénovation du palais du Caïd', status: 'RETARD' as const, deadline: new Date('2025-06-30') },
        { text: 'Zone d\'accueil touristique — parking et guichet', status: 'RETARD' as const, deadline: new Date('2025-04-30') },
        { text: 'Mise en valeur des foggara (réseau hydraulique traditionnel)', status: 'RETARD' as const, deadline: new Date('2025-08-31') },
        { text: 'Signalétique bilingue patrimoine', status: 'RETARD' as const, deadline: new Date('2025-05-31') },
        { text: 'Parcours de randonnée — massif du Gourara', status: 'RETARD' as const, deadline: new Date('2025-10-31') },
      ],
    },
    {
      name: 'Énergie Solaire',
      avancement: 60,
      lat: 29.2730, lng: 0.2150,
      actions: [
        { text: 'Installation centrale photovoltaïque 2 MWc — Timimoun nord', status: 'DONE' as const, deadline: new Date('2024-06-30') },
        { text: 'Raccordement réseau basse tension — 3 communes', status: 'DONE' as const, deadline: new Date('2024-10-31') },
        { text: 'Éclairage solaire public — 8 villages', status: 'DONE' as const, deadline: new Date('2024-12-31') },
        { text: 'Extension centrale 1 MWc supplémentaire', status: 'EN_COURS' as const, deadline: new Date('2025-08-31') },
        { text: 'Formation techniciens locaux maintenance solaire', status: 'RETARD' as const, deadline: new Date('2025-04-30') },
      ],
    },
  ]

  for (const pd of patDefs) {
    const existing = await prisma.pAT.findFirst({
      where: { name: pd.name, projectId: timimounPAW.id },
    })
    if (existing) {
      console.log(`  ↩ skipped (exists)  PAT: ${pd.name}`)
      continue
    }

    const pat = await prisma.pAT.create({
      data: {
        name: pd.name,
        avancement: pd.avancement,
        projectId: timimounPAW.id,
        actions: {
          create: pd.actions.map((a) => ({
            text: a.text,
            status: a.status,
            deadline: a.deadline,
          })),
        },
      },
    })

    // Set PostGIS location
    await prisma.$executeRawUnsafe(
      `UPDATE "PAT" SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
      pd.lng, pd.lat, pat.id,
    )

    console.log(`  ✓ PAT [${pd.avancement}%] ${pd.name} — ${pd.actions.length} actions`)
  }

  // ── Signalements with commune data (for landing page stats) ───────────────
  console.log('\n📣  Creating signalements…')

  const signalements = [
    { title: 'Fuite d\'eau rue Benhamouda', description: 'Fuite importante sur conduite principale depuis 3 jours', category: 'EAU' as const, status: 'RESOLU' as const, wilaya: 'Timimoun', commune: 'Timimoun' },
    { title: 'Nid de poule RN51 km 12', description: 'Affaissement dangereux sur la route nationale', category: 'VOIRIE' as const, status: 'PRIS_EN_CHARGE' as const, wilaya: 'Timimoun', commune: 'Charouine' },
    { title: 'Éclairage défaillant marché central', description: 'Plusieurs lampadaires hors service depuis 2 semaines', category: 'EQUIPEMENTS_PUBLICS' as const, status: 'RESOLU' as const, wilaya: 'Timimoun', commune: 'Timimoun' },
    { title: 'Dépôt sauvage oued Saoura', description: 'Accumulation de déchets ménagers sur les berges', category: 'DECHETS' as const, status: 'EN_COURS' as const, wilaya: 'Timimoun', commune: 'Ouled Saïd' },
    { title: 'Canalisation bouchée cité 200 logements', description: 'Problème d\'évacuation eaux usées', category: 'EAU' as const, status: 'PRIS_EN_CHARGE' as const, wilaya: 'Timimoun', commune: 'Timimoun' },
    { title: 'Route impraticable vers Kali', description: 'Piste totalement dégradée après les pluies', category: 'VOIRIE' as const, status: 'RECU' as const, wilaya: 'Timimoun', commune: 'Kali' },
    { title: 'Poste de santé fermé — Ouled Aïssa', description: 'Pas de médecin depuis 3 mois', category: 'SANTE' as const, status: 'EN_COURS' as const, wilaya: 'Timimoun', commune: 'Ouled Aïssa' },
    { title: 'Terrain scolaire non clôturé', description: 'Danger pour les élèves — pas de clôture', category: 'EDUCATION' as const, status: 'RESOLU' as const, wilaya: 'Timimoun', commune: 'Aougrout' },
    { title: 'Transformateur électrique en panne', description: 'Coupures fréquentes quartier nord', category: 'EQUIPEMENTS_PUBLICS' as const, status: 'PRIS_EN_CHARGE' as const, wilaya: 'Timimoun', commune: 'Timimoun' },
    { title: 'Ordures non collectées — souk hebdomadaire', description: 'La collecte n\'est pas assurée après le marché du vendredi', category: 'DECHETS' as const, status: 'RESOLU' as const, wilaya: 'Timimoun', commune: 'Charouine' },
  ]

  let created = 0
  for (const s of signalements) {
    const exists = await prisma.signalement.findFirst({ where: { title: s.title } })
    if (exists) continue
    await prisma.signalement.create({
      data: {
        title: s.title,
        description: s.description,
        category: s.category,
        status: s.status,
        wilaya: s.wilaya,
        commune: s.commune,
        citizenId: citoyen.id,
      },
    })
    created++
  }
  console.log(`  ✓ ${created} signalements created (${signalements.length - created} skipped)`)

  console.log('\n✅  PAT seed complete.')
  console.log('  Timimoun PAW →', timimounPAW.id)
  console.log('  Admin login   →  superadmin@gov.dz / Admin1234!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
