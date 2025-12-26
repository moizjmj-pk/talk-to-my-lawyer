#!/usr/bin/env node

/**
 * Pre-deployment Checklist Script
 * 
 * Runs comprehensive checks before deploying to production
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const REQUIRED_FILES = [
  '.env.example',
  'SECURITY.md',
  'LICENSE',
  'DEPLOYMENT.md',
  'README.md',
  'package.json',
  'next.config.mjs',
  'Dockerfile',
  'docker-compose.yml',
]

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'ADMIN_PORTAL_KEY',
  'CRON_SECRET',
  'EMAIL_PROVIDER',
  'EMAIL_FROM',
]

let errors = []
let warnings = []
let passed = []

console.log('🔍 Running Pre-Deployment Checks...\n')

// Check 1: Required files exist
console.log('📄 Checking required files...')
REQUIRED_FILES.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file))
  if (exists) {
    passed.push(`✅ ${file} exists`)
  } else {
    errors.push(`❌ ${file} is missing`)
  }
})

// Check 2: Environment variables
console.log('🔐 Checking environment variables...')
require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

REQUIRED_ENV_VARS.forEach(envVar => {
  const value = process.env[envVar]
  if (value) {
    passed.push(`✅ ${envVar} is set`)
  } else {
    if (process.env.NODE_ENV === 'production') {
      errors.push(`❌ ${envVar} is not set (required for production)`)
    } else {
      warnings.push(`⚠️  ${envVar} is not set (optional for dev)`)
    }
  }
})

// Check 3: Test mode in production
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_TEST_MODE === 'true') {
  errors.push('❌ ENABLE_TEST_MODE should be false in production')
} else {
  passed.push('✅ Test mode correctly configured')
}

// Check 4: Build succeeds
console.log('🏗️  Testing build...')
try {
  execSync('npm run build', { stdio: 'pipe' })
  passed.push('✅ Build succeeds')
} catch (error) {
  errors.push('❌ Build fails')
}

// Check 5: Linting passes
console.log('🔍 Running linter...')
try {
  execSync('npm run lint', { stdio: 'pipe' })
  passed.push('✅ Linting passes')
} catch (error) {
  warnings.push('⚠️  Linting has warnings/errors')
}

// Check 6: TypeScript check
console.log('📘 Checking TypeScript...')
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' })
  passed.push('✅ TypeScript check passes')
} catch (error) {
  errors.push('❌ TypeScript errors found')
}

// Check 7: Security - No secrets in code
console.log('🔒 Checking for hardcoded secrets...')
const secretPatterns = [
  /sk_live_[a-zA-Z0-9]+/g,  // Stripe live keys
  /sk_test_[a-zA-Z0-9]+/g,  // Stripe test keys
  /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,  // JWT tokens
]

let secretsFound = false
function checkFileForSecrets(filePath) {
  if (filePath.includes('node_modules') || filePath.includes('.next')) return
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx') && !filePath.endsWith('.js')) return
  
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    secretPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        errors.push(`❌ Possible secret found in ${filePath}`)
        secretsFound = true
      }
    })
  } catch (err) {
    // Ignore file read errors
  }
}

// Scan common directories
const dirsToScan = ['app', 'lib', 'components']
dirsToScan.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = execSync(`find ${dir} -type f`, { encoding: 'utf8' }).split('\n')
    files.forEach(checkFileForSecrets)
  }
})

if (!secretsFound) {
  passed.push('✅ No hardcoded secrets found')
}

// Check 8: Package vulnerabilities
console.log('🛡️  Checking for vulnerabilities...')
try {
  const audit = execSync('npm audit --production --audit-level=high', { encoding: 'utf8' })
  if (audit.includes('found 0 vulnerabilities')) {
    passed.push('✅ No high/critical vulnerabilities')
  } else {
    warnings.push('⚠️  Security vulnerabilities found - run npm audit')
  }
} catch (error) {
  warnings.push('⚠️  Vulnerability check failed')
}

// Check 9: .gitignore is correct
console.log('📝 Checking .gitignore...')
const gitignore = fs.readFileSync('.gitignore', 'utf8')
const requiredIgnores = ['.env.local', '.env.production', 'node_modules', '.next']
let gitignoreOk = true
requiredIgnores.forEach(pattern => {
  if (!gitignore.includes(pattern)) {
    warnings.push(`⚠️  .gitignore missing: ${pattern}`)
    gitignoreOk = false
  }
})
if (gitignoreOk) {
  passed.push('✅ .gitignore is configured correctly')
}

// Check 10: Database migrations
console.log('💾 Checking database migrations...')
const migrationsExist = fs.existsSync('scripts') && 
  fs.readdirSync('scripts').some(f => f.endsWith('.sql'))
if (migrationsExist) {
  passed.push('✅ Database migration scripts found')
} else {
  warnings.push('⚠️  No database migrations found')
}

// Print results
console.log('\n' + '='.repeat(60))
console.log('📊 Pre-Deployment Check Results')
console.log('='.repeat(60) + '\n')

if (passed.length > 0) {
  console.log('✅ Passed Checks:')
  passed.forEach(p => console.log(`  ${p}`))
  console.log('')
}

if (warnings.length > 0) {
  console.log('⚠️  Warnings:')
  warnings.forEach(w => console.log(`  ${w}`))
  console.log('')
}

if (errors.length > 0) {
  console.log('❌ Failed Checks:')
  errors.forEach(e => console.log(`  ${e}`))
  console.log('')
}

console.log('='.repeat(60))
console.log(`Total: ${passed.length} passed, ${warnings.length} warnings, ${errors.length} errors`)
console.log('='.repeat(60) + '\n')

// Exit with appropriate code
if (errors.length > 0) {
  console.log('❌ Pre-deployment checks FAILED!')
  console.log('Please fix the errors above before deploying.\n')
  process.exit(1)
} else if (warnings.length > 0) {
  console.log('⚠️  Pre-deployment checks passed with warnings.')
  console.log('Review the warnings above before deploying.\n')
  process.exit(0)
} else {
  console.log('✅ All pre-deployment checks passed!')
  console.log('You are ready to deploy to production.\n')
  process.exit(0)
}
