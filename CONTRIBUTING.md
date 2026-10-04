# Contributing to Cert Prep

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person

## Getting Started

### Prerequisites

- Node.js 22+ and npm/pnpm
- A Supabase account for local development

### Local Development Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/cert-prep.git
cd cert-prep

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# 4. Set up database
npm run db:migrate
npm run db:seed

# 5. Start development server
npm run dev
```

## Development Workflow

### Branches

- `main` — production-ready code
- Feature branches: `feature/issue-number` or `feature/short-description`

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

Optional body with more details.

Optional footer with issue references: Closes #123
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`

Examples:

```
feat(quiz): add keyboard navigation support
fix(auth): resolve JWT token expiration handling
docs(readme): clarify database migration steps
test(glossary): increase search filter coverage to 85%
```

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear, focused commits
3. Write or update tests (maintain 80%+ coverage)
4. Run the full verification suite:
   ```bash
   npm run verify
   ```
5. Push your branch and open a PR against `main`
6. Respond to review feedback
7. PR must pass CI/CD checks before merging

## Testing

We use Vitest for unit/component tests. Maintain **80%+ code coverage**.

```bash
# Run tests
npm test

# Run tests with watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Guidelines

- Unit tests: isolated logic, fast, no side effects
- Component tests: user interactions, accessibility
- Use Testing Library for React components
- Mock Supabase calls with `@testing-library/react`
- Files: `*.test.ts` / `*.test.tsx`

### Test File Naming

- Unit: `src/module/utils.test.ts`
- Components: `src/module/Component.test.tsx`

## Code Style

### Linting & Formatting

```bash
# Lint TypeScript/TSX
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Format with Prettier
npm run format

# Check formatting without modifying
npm run format:check

# Type check
npm run typecheck
```

### TypeScript

- `strict: true` mode enabled
- Use explicit types, avoid `any`
- No unused variables or parameters

### React Best Practices

- Prefer functional components with hooks
- Use the `@/*` import alias for cleaner imports
- Keep components small and focused
- Extract common logic into custom hooks

### Naming Conventions

- Components: PascalCase (`QuestionCard.tsx`)
- Utilities: camelCase (`formatDate.ts`)
- Constants: UPPER_CASE (`ITEMS_PER_PAGE`)
- Hooks: camelCase starting with `use` (`useQuestionBank`)

## Adding a New Certification

The platform is certification-agnostic. To add a new certification:

1. **Register** in `src/certifications/registry.ts`
2. **Database** — create migration: `npm run db:migrate:new`, then add cert and domains
3. **Domains** — create `src/quiz/data/<certId>/domains.ts`
4. **Questions** — create `src/quiz/data/<certId>/exams/examN.ts` files
5. **Glossary** — create `src/study/data/<certId>/glossary.ts`
6. **Exam facts** — create `src/study/data/<certId>/examMeta.ts`
7. **Study guide** (optional) — create `src/guide/data/<certId>/topics/*.ts` files
8. Run and test:
   ```bash
   npm run db:migrate
   npm run db:seed
   npm test
   npm run build
   ```

See the README's [Adding a new certification](README.md#adding-a-new-certification) section for details.

## Documentation

- **README**: project overview, setup, available scripts
- **Inline comments**: explain "why", not "what" (code structure should be obvious)
- **Commit messages**: link to related issues
- **Pull requests**: describe the problem and solution

## Accessibility (WCAG)

The app must be accessible to everyone.

- Semantic HTML (`<button>`, `<nav>`, `<main>`, etc.)
- ARIA labels where necessary
- Color contrast: WCAG AA minimum (4.5:1 for text)
- Keyboard navigation: Tab through all interactive elements
- Reduced motion: respect `prefers-reduced-motion`

Test with:

- Browser DevTools → Lighthouse → Accessibility
- Screen readers (VoiceOver on Mac, Narrator on Windows)
- Keyboard only (no mouse)

## Performance

- Bundle size: monitor with `npm run build` output
- Lazy load routes (already configured)
- Optimize images: no uncompressed large images
- Minimize re-renders: use `useMemo`, `useCallback` wisely (only when proven necessary)

## Security

- Never commit secrets (`.env` is in `.gitignore`)
- Validate user input (Zod schemas in place)
- Respect Supabase row-level security
- Report security issues to maintainers privately, don't open public issues

## Database Migrations

- Use Supabase CLI: `npm run db:migrate:new`
- Name migrations clearly: `0006_add_user_preferences.sql`
- Migrations are applied in order and are immutable
- For breaking changes, write both up and down migrations

## Deployment

- Merges to `main` trigger CI/CD
- Production deployments are manual after CI passes
- Docker: `docker compose up --build`

## Getting Help

- Check existing issues and discussions
- Read the README and error messages carefully
- Ask in pull request comments or discussions

## Reporting Issues

When reporting bugs, include:

- **Description**: what happened?
- **Steps to reproduce**: how to make it happen again?
- **Expected behavior**: what should happen?
- **Actual behavior**: what actually happened?
- **Environment**: OS, browser, Node version
- **Screenshots**: if UI-related

## Performance Checklist

Before submitting a PR:

- [ ] `npm run verify` passes
- [ ] Tests added/updated for new code
- [ ] Coverage ≥ 80%
- [ ] No console errors/warnings
- [ ] Accessibility checked (keyboard, screen reader, contrast)
- [ ] Bundle size impact assessed
- [ ] Commit messages follow Conventional Commits
- [ ] PR description explains the problem and solution

---

Thank you for contributing! 🎉
