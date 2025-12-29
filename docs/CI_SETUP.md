# CI/CD Pipeline Documentation

## Overview

The project uses GitHub Actions for continuous integration and testing. The pipeline runs on every push to `main` and on pull requests.

## Pipeline Steps

1. **Checkout** - Get the latest code
2. **Setup pnpm** - Install package manager
3. **Setup Node.js** - Install Node.js runtime
4. **Install dependencies** - Install all project dependencies
5. **Run linter** - Check code quality and style
6. **Security audit** - Check for high-severity vulnerabilities
7. **Build project** - Create production build
8. **Environment validation** - Validate environment configuration

## Environment Variables for CI

The CI pipeline uses dummy environment variables from `.env.ci` to validate the environment setup without requiring real secrets. This ensures:

- The validation script works correctly
- The build process can complete
- No real credentials are exposed in CI logs

### CI Environment File (`.env.ci`)

Contains safe dummy values for:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`
- `ENABLE_TEST_MODE=true`

## Environment Validation Modes

### Development Mode

- Requires critical environment variables
- Warns about missing production variables
- Uses `.env.local` and `.env` files

### CI Mode

- Accepts dummy values for critical variables
- Shows warnings instead of errors for missing variables
- Uses `.env.ci` file for testing

### Production Mode

- Requires all critical and production environment variables
- Fails if any required variables are missing

## Running CI Locally

To test the CI environment validation locally:

```bash
# Copy CI environment file
cp .env.ci .env

# Run validation in CI mode
CI=true node scripts/validate-env.js

# Clean up
rm .env
```

## Adding New Environment Variables

When adding new required environment variables:

1. Add to `scripts/validate-env.js` in the appropriate category
2. Add dummy values to `.env.ci` if needed for CI
3. Update this documentation

## Troubleshooting

- If CI fails on environment validation, check that `.env.ci` has all required dummy values
- If adding new critical variables, ensure they're included in `.env.ci`
- For production deployment, ensure all real environment variables are configured in your hosting platform
