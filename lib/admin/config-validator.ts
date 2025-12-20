/**
 * Admin Configuration Validator
 *
 * Validates all required admin environment variables on application startup.
 * This ensures admin authentication is properly configured.
 */

interface AdminConfig {
  adminEmail?: string
  adminPassword?: string
  adminPortalKey?: string
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate admin environment variables
 * Returns validation result with any errors or warnings
 */
export function validateAdminConfig(): AdminConfig {
  const config: AdminConfig = {
    isValid: true,
    errors: [],
    warnings: []
  }

  // Check admin email
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    config.isValid = false
    config.errors.push('ADMIN_EMAIL environment variable is required')
  } else if (!adminEmail.includes('@')) {
    config.isValid = false
    config.errors.push('ADMIN_EMAIL must be a valid email address')
  } else {
    config.adminEmail = adminEmail
  }

  // Check admin password
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    config.isValid = false
    config.errors.push('ADMIN_PASSWORD environment variable is required')
  } else if (adminPassword.length < 8) {
    config.warnings.push('ADMIN_PASSWORD should be at least 8 characters long')
  } else {
    config.adminPassword = adminPassword
  }

  // Check admin portal key
  const adminPortalKey = process.env.ADMIN_PORTAL_KEY
  if (!adminPortalKey) {
    config.isValid = false
    config.errors.push('ADMIN_PORTAL_KEY environment variable is required')
  } else if (adminPortalKey.length < 16) {
    config.warnings.push('ADMIN_PORTAL_KEY should be at least 16 characters long for security')
  } else {
    config.adminPortalKey = adminPortalKey
  }

  // Additional security checks
  const nodeEnv = process.env.NODE_ENV
  if (nodeEnv === 'production') {
    // Check for common/default passwords in production
    if (adminPassword && ['admin', 'password', '123456'].includes(adminPassword.toLowerCase())) {
      config.isValid = false
      config.errors.push('Using default or weak passwords in production is not allowed')
    }

    // Check for default portal keys
    if (adminPortalKey && ['admin', 'portal', 'key', 'default'].includes(adminPortalKey.toLowerCase())) {
      config.isValid = false
      config.errors.push('Using default portal keys in production is not allowed')
    }
  }

  return config
}

/**
 * Validate admin config and log results
 * Should be called during application startup
 */
export function validateAndLogAdminConfig(): void {
  const config = validateAdminConfig()

  if (!config.isValid) {
    console.error('\n❌ ADMIN CONFIGURATION VALIDATION FAILED')
    console.error('Admin authentication will not work properly!')
    console.error('\nErrors:')
    config.errors.forEach(error => {
      console.error(`  - ${error}`)
    })
    console.error('\nPlease set these environment variables before starting the application.\n')

    // In development, continue with warnings but in production, we should not
    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    }
  } else {
    console.log('✅ Admin configuration is valid')

    if (config.warnings.length > 0) {
      console.log('\n⚠️  Warnings:')
      config.warnings.forEach(warning => {
        console.log(`  - ${warning}`)
      })
      console.log()
    }
  }
}

/**
 * Check if admin authentication is configured
 * Returns true if all required variables are set
 */
export function isAdminAuthConfigured(): boolean {
  const config = validateAdminConfig()
  return config.isValid
}

/**
 * Get admin configuration status (for health checks)
 */
export function getAdminConfigStatus() {
  const config = validateAdminConfig()
  return {
    configured: config.isValid,
    emailSet: !!process.env.ADMIN_EMAIL,
    passwordSet: !!process.env.ADMIN_PASSWORD,
    portalKeySet: !!process.env.ADMIN_PORTAL_KEY,
    errorCount: config.errors.length,
    warningCount: config.warnings.length
  }
}