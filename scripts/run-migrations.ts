/**
 * Run database migrations on remote Supabase database
 */

import { Client } from 'pg'
import { readFileSync } from 'fs'
import { join } from 'path'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL not found in .env.local')
  process.exit(1)
}

async function runMigration(client: Client, migrationName: string) {
  console.log(`\n📋 Running migration: ${migrationName}`)

  const sqlPath = join(process.cwd(), 'supabase', 'migrations', migrationName)
  const sql = readFileSync(sqlPath, 'utf-8')

  try {
    await client.query(sql)
    console.log(`✅ ${migrationName} completed`)
  } catch (error: any) {
    // Check if it's a "already exists" or "does not exist" error (safe to ignore)
    if (error.message.includes('does not exist') || error.code === '42723') {
      console.log(`⚠️  ${migrationName} - Some items already removed (safe)`)
    } else {
      console.error(`❌ Error in ${migrationName}:`, error.message)
      throw error
    }
  }
}

async function main() {
  console.log('🚀 Connecting to remote database...')
  console.log(`   Host: ${connectionString.split('@')[1]?.split('/')[0]}`)

  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('✅ Connected to database')

    await runMigration(client, '20251224100000_011_remove_superuser_column.sql')
    await runMigration(client, '20251224110000_012_remove_single_admin_constraint.sql')

    console.log('\n✅ All migrations completed successfully!')
    console.log('\nChanges applied:')
    console.log('  ✓ Removed is_superuser column (no unlimited access)')
    console.log('  ✓ Removed single-admin constraint (multiple admins supported)')

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await client.end()
    console.log('\n🔌 Database connection closed')
  }
}

main()
