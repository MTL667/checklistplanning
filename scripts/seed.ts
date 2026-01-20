/**
 * Database Seed Script
 * Run with: npx tsx scripts/seed.ts
 *
 * Creates initial data for the application:
 * - Default admin user
 * - Sample task types
 * - Sample inspectors (optional)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...\n')

  // Create default task types
  console.log('📋 Creating task types...')
  const tasks = await Promise.all([
    prisma.taskType.upsert({
      where: { id: 'task-1' },
      update: {},
      create: {
        id: 'task-1',
        nameNl: 'Dagstart checklist',
        nameFr: 'Checklist de début de journée',
        descriptionNl: 'Controleer alle systemen bij het opstarten',
        descriptionFr: 'Vérifier tous les systèmes au démarrage',
        frequency: 'DAILY',
        sortOrder: 1,
        isActive: true
      }
    }),
    prisma.taskType.upsert({
      where: { id: 'task-2' },
      update: {},
      create: {
        id: 'task-2',
        nameNl: 'Inspecteurs toewijzen',
        nameFr: 'Affecter les inspecteurs',
        descriptionNl: 'Wijs inspecteurs toe aan routes',
        descriptionFr: 'Affecter les inspecteurs aux routes',
        frequency: 'DAILY',
        sortOrder: 2,
        isActive: true
      }
    }),
    prisma.taskType.upsert({
      where: { id: 'task-3' },
      update: {},
      create: {
        id: 'task-3',
        nameNl: 'Omzet invoeren',
        nameFr: 'Saisir le chiffre d\'affaires',
        descriptionNl: 'Voer de dagelijkse omzet in voor alle inspecteurs',
        descriptionFr: 'Saisir le chiffre d\'affaires quotidien pour tous les inspecteurs',
        frequency: 'DAILY',
        sortOrder: 3,
        isActive: true
      }
    }),
    prisma.taskType.upsert({
      where: { id: 'task-4' },
      update: {},
      create: {
        id: 'task-4',
        nameNl: 'Dagrapport controleren',
        nameFr: 'Vérifier le rapport quotidien',
        descriptionNl: 'Controleer het dagrapport op volledigheid',
        descriptionFr: 'Vérifier l\'exhaustivité du rapport quotidien',
        frequency: 'DAILY',
        sortOrder: 4,
        isActive: true
      }
    }),
    prisma.taskType.upsert({
      where: { id: 'task-5' },
      update: {},
      create: {
        id: 'task-5',
        nameNl: 'Weekoverzicht maken',
        nameFr: 'Créer un aperçu hebdomadaire',
        descriptionNl: 'Maak het wekelijkse overzicht',
        descriptionFr: 'Créer l\'aperçu hebdomadaire',
        frequency: 'WEEKLY',
        sortOrder: 5,
        isActive: true
      }
    })
  ])
  console.log(`   ✅ Created ${tasks.length} task types\n`)

  // Create sample inspectors (optional)
  console.log('👤 Creating sample inspectors...')
  const inspectors = await Promise.all([
    prisma.inspector.upsert({
      where: { id: 'inspector-1' },
      update: {},
      create: {
        id: 'inspector-1',
        name: 'Jan Janssen',
        defaultTarget: 500,
        isActive: true
      }
    }),
    prisma.inspector.upsert({
      where: { id: 'inspector-2' },
      update: {},
      create: {
        id: 'inspector-2',
        name: 'Marie Dubois',
        defaultTarget: 450,
        isActive: true
      }
    }),
    prisma.inspector.upsert({
      where: { id: 'inspector-3' },
      update: {},
      create: {
        id: 'inspector-3',
        name: 'Peter De Vries',
        defaultTarget: 550,
        isActive: true
      }
    })
  ])
  console.log(`   ✅ Created ${inspectors.length} sample inspectors\n`)

  console.log('🎉 Database seeding completed!')
  console.log('')
  console.log('Next steps:')
  console.log('1. Login with your Microsoft account')
  console.log('2. The first user will need to be promoted to ADMIN manually:')
  console.log('')
  console.log('   npx prisma db execute --stdin <<< "UPDATE \\"User\\" SET role = \'ADMIN\' WHERE email = \'your@email.com\';"')
  console.log('')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
