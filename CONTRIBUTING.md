# Contributing to Talk-To-My-Lawyer

Thank you for your interest in contributing to Talk-To-My-Lawyer! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in all interactions.

### Expected Behavior

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, discrimination, or inappropriate comments
- Trolling, insulting, or derogatory remarks
- Publishing others' private information
- Other conduct deemed inappropriate

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm 10.25.0+
- Git for version control
- A code editor (VS Code recommended)
- Basic understanding of TypeScript and React

### Setup Development Environment

1. **Fork the repository**
   ```bash
   # Click "Fork" button on GitHub
   # Then clone your fork
   git clone https://github.com/YOUR_USERNAME/talk-to-my-lawyer.git
   cd talk-to-my-lawyer
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your development credentials
   ```

4. **Run development server**
   ```bash
   pnpm dev
   ```

5. **Verify setup**
   - Open http://localhost:3000
   - Check for console errors
   - Run `pnpm lint` and `pnpm build`

### Branch Naming Convention

Use descriptive branch names following this pattern:

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Adding or updating tests
- `chore/description` - Maintenance tasks

Examples:
```bash
git checkout -b feature/add-letter-templates
git checkout -b fix/stripe-webhook-validation
git checkout -b docs/update-deployment-guide
```

## Development Process

### 1. Pick an Issue

- Browse [open issues](https://github.com/moizjmj-pk/talk-to-my-lawyer/issues)
- Comment on the issue you want to work on
- Wait for assignment before starting work

### 2. Create a Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### 3. Make Changes

- Write clean, maintainable code
- Follow the coding standards below
- Add tests for new functionality
- Update documentation as needed

### 4. Test Your Changes

```bash
# Run linter
pnpm lint

# Build the project
CI=1 pnpm build

# Run tests (when available)
# pnpm test

# Manual testing
pnpm dev
```

### 5. Commit Changes

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: <type>(<scope>): <description>

git add .
git commit -m "feat(letters): add letter template system"
git commit -m "fix(auth): resolve session timeout issue"
git commit -m "docs(readme): update installation instructions"
```

**Commit Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting (no logic change)
- `refactor`: Code restructuring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes

### 6. Push Changes

```bash
git push origin feature/your-feature-name
```

### 7. Create Pull Request

1. Go to GitHub repository
2. Click "New Pull Request"
3. Select your branch
4. Fill out the PR template
5. Link related issues

## Pull Request Process

### PR Checklist

Before submitting your PR, ensure:

- [ ] Code follows project coding standards
- [ ] All tests pass (when available)
- [ ] Linter passes: `pnpm lint`
- [ ] Build succeeds: `CI=1 pnpm build`
- [ ] Documentation is updated
- [ ] Commit messages follow conventions
- [ ] PR description is clear and complete
- [ ] No sensitive data (API keys, passwords) is committed
- [ ] Changes are minimal and focused

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123

## Testing
How has this been tested?

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
```

### Review Process

1. **Automated Checks**
   - Linting
   - Build verification
   - Type checking

2. **Code Review**
   - Reviewer assigned within 48 hours
   - Address feedback promptly
   - Make requested changes

3. **Approval & Merge**
   - Requires 1 approval
   - All checks must pass
   - Maintainer will merge

## Coding Standards

### TypeScript

```typescript
// Use explicit types
function calculateTotal(price: number, tax: number): number {
  return price + tax
}

// Use interfaces for objects
interface UserProfile {
  id: string
  email: string
  name: string | null
}

// Prefer const over let
const API_URL = process.env.NEXT_PUBLIC_API_URL
```

### React Components

```typescript
// Use functional components
export function MyComponent({ title }: { title: string }) {
  return <h1>{title}</h1>
}

// Use 'use client' directive when needed
'use client'
import { useState } from 'react'

export function ClientComponent() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}

// Server components by default (no directive needed)
export async function ServerComponent() {
  const data = await fetchData()
  return <div>{data}</div>
}
```

### File Organization

```
app/
  dashboard/
    page.tsx           # Main page component
    layout.tsx         # Layout wrapper
    loading.tsx        # Loading state
    error.tsx          # Error boundary
  api/
    route-name/
      route.ts         # API route handler
```

### Naming Conventions

- **Files**: `kebab-case.tsx`
- **Components**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas
- Use semicolons
- Max line length: 100 characters
- Use async/await over promises

### Comments

```typescript
// Good: Explain why, not what
// Deduct allowance before generation to prevent race conditions
await deductLetterAllowance(userId)

// Bad: Obvious comment
// Set user ID
const userId = user.id
```

## Testing Guidelines

### Unit Tests (Future)

```typescript
// tests/utils/sanitize.test.ts
import { sanitizeString } from '@/lib/security/input-sanitizer'

describe('sanitizeString', () => {
  it('should remove HTML tags', () => {
    expect(sanitizeString('<script>alert("xss")</script>'))
      .toBe('alert("xss")')
  })
})
```

### Integration Tests (Future)

```typescript
// tests/api/generate-letter.test.ts
describe('POST /api/generate-letter', () => {
  it('should generate letter with valid input', async () => {
    const response = await fetch('/api/generate-letter', {
      method: 'POST',
      body: JSON.stringify({ letterType: 'demand_letter', ... })
    })
    expect(response.status).toBe(200)
  })
})
```

## Documentation

### Code Documentation

- Add JSDoc comments for public functions
- Document complex logic
- Update README.md for new features
- Keep ARCHITECTURE_PLAN.md current

### API Documentation

When adding/modifying API routes:

1. Document in code comments
2. Update API section in README
3. Add example requests/responses
4. Document error codes

Example:
```typescript
/**
 * Generate a new legal letter
 * 
 * @route POST /api/generate-letter
 * @auth Required (subscriber role)
 * @ratelimit 5 requests per hour
 * 
 * @body {
 *   letterType: string,
 *   intakeData: object
 * }
 * 
 * @returns {
 *   success: boolean,
 *   letterId: string,
 *   status: string,
 *   aiDraft: string
 * }
 * 
 * @errors
 *   401 - Unauthorized
 *   403 - Forbidden (not subscriber)
 *   429 - Rate limit exceeded
 *   400 - Invalid input
 */
```

## Security Considerations

### Never Commit

- API keys or secrets
- Environment files (.env.local, .env.production)
- User data or PII
- Database credentials
- Private keys

### Always

- Validate user input
- Sanitize data before storage
- Use parameterized queries
- Follow principle of least privilege
- Keep dependencies updated
- Report security vulnerabilities privately

## Questions or Need Help?

- **Documentation**: Check README.md, ARCHITECTURE_PLAN.md
- **Issues**: Search existing issues
- **Discussions**: Use GitHub Discussions
- **Email**: support@talk-to-my-lawyer.com

## Recognition

Contributors will be recognized in:
- GitHub contributors page
- Release notes
- CONTRIBUTORS.md (future)

Thank you for contributing to Talk-To-My-Lawyer! 🎉

---

**Last Updated**: December 26, 2024
