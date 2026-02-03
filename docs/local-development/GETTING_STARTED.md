# Getting Started - Local Development

Welcome! This guide will help you set up and run tests for the flood-data project.

## Prerequisites

Install these before starting:

1. **Node.js 20.x**
   ```bash
   node --version  # Should be v20.x
   ```

2. **Docker**
   ```bash
   docker --version
   ```

3. **awscli-local** (for LocalStack integration tests)
   ```bash
   pip install awscli-local
   awslocal --version
   ```

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd flood-data
npm install
```

### 2. Run Unit Tests

Unit tests are fast, require no Docker, and mock all external dependencies:

```bash
npm test
```

Expected output:
```
116 tests complete
Test duration: ~1000 ms
Coverage: 95%
```

**If this works, your development environment is set up correctly!**

## Testing Approaches

We have two complementary testing strategies:

### Unit Tests (`npm test`)

**Purpose:** Fast feedback on code correctness

**What's tested:**
- Individual functions in isolation
- Business logic and data transformations
- Error handling

**What's mocked:**
- Database connections (Sinon stubs)
- AWS S3 calls (Sinon stubs)
- HTTP requests (Sinon stubs)
- External APIs (Sinon stubs)

**When to use:**
- During development (TDD/BDD workflow)
- Before committing code
- In CI/CD pipelines
- Quick validation after changes

**Run:**
```bash
npm test                          # All unit tests
npm test -- test/unit/functions/  # Just function tests
npm test -- test/unit/models/     # Just model tests
```

### LocalStack Integration Tests (`npm run localstack-test`)

**Purpose:** Test full AWS Lambda execution with real services

**What's tested:**
- Lambda deployment and packaging
- S3 event handling
- Database writes (PostgreSQL)
- End-to-end data flow
- AWS SDK integration

**What's real:**
- LocalStack services (Lambda, S3)
- PostgreSQL database
- Lambda execution environment
- Docker networking

**When to use:**
- Before deploying to AWS
- Testing infrastructure changes
- Validating AWS service integration
- Complex workflow testing

**Run:**
```bash
# Full setup required (see LocalStack Testing guide)
npm run localstack-test
```

## Development Workflow

### Typical Development Cycle

1. **Make code changes**
   ```bash
   # Edit lib/functions/fwis-process.js
   ```

2. **Run relevant unit tests**
   ```bash
   npm test -- test/unit/functions/fwis-process.js
   ```

3. **Run all unit tests before committing**
   ```bash
   npm test
   ```

4. **(Optional) Run integration tests**
   ```bash
   # Only when testing AWS integration
   npm run localstack-test
   ```

### Test-Driven Development (TDD)

1. Write a failing test
2. Run `npm test` to confirm it fails
3. Write minimal code to make it pass
4. Run `npm test` to confirm it passes
5. Refactor if needed
6. Repeat

### Before Pushing Code

```bash
# 1. Ensure all tests pass
npm test

# 2. Check linting
npm run lint

# 3. (Optional) Run integration tests
npm run localstack-test
```

## Project Structure

```
flood-data/
├── lib/
│   ├── functions/         # Lambda handler functions
│   ├── models/            # Data models (fwis, rloi, etc.)
│   └── helpers/           # Utility functions (db, s3, wreck)
├── test/
│   ├── unit/              # Fast, mocked unit tests
│   │   ├── functions/     # Tests for Lambda handlers
│   │   ├── models/        # Tests for models
│   │   └── helpers/       # Tests for utilities
│   ├── integration/       # Slower integration tests
│   │   └── localstack/    # LocalStack-specific tests
│   ├── data/              # Test fixtures (XML, JSON)
│   └── fixtures/          # Additional test data
├── scripts/               # Helper scripts for LocalStack
└── docs/
    └── local-development/ # This documentation
```

## Common Tasks

### Run specific test file
```bash
npm test -- test/unit/functions/fwis-process-new.js
```

### Run tests in watch mode (re-run on file change)
```bash
npm test -- --watch
```

### View test coverage
```bash
npm test  # Coverage report shown at end
# Detailed coverage report: coverage/lcov.info
```

### Fix linting issues
```bash
npm run lint        # Check for issues
npx standard --fix  # Auto-fix issues
```

## Next Steps

### For Unit Testing Only
You're ready! Just run `npm test` and start developing.

### For LocalStack Integration Testing
See [LOCALSTACK_TESTING.md](./LOCALSTACK_TESTING.md) for:
- Docker setup
- LocalStack configuration
- PostgreSQL database setup
- Running integration tests

## Getting Help

### Documentation
- [LocalStack Testing Guide](./LOCALSTACK_TESTING.md) - Integration test setup
- [Manual Local Development](./manual.md) - Alternative development approaches
- [Dev Container Guide](./devcontainer.md) - VS Code dev container setup

### Common Issues

**Tests fail with "Module not found"**
```bash
# Re-install dependencies
rm -rf node_modules
npm install
```

**Linting errors**
```bash
# Auto-fix most issues
npx standard --fix
```

**Database connection errors (unit tests)**
This shouldn't happen! Unit tests mock the database. If you see this, check that:
- You're running `npm test` (not `npm run integration-test`)
- The test file properly stubs database connections

**Need to test against real AWS?**
The LocalStack integration tests provide a local AWS environment. See [LOCALSTACK_TESTING.md](./LOCALSTACK_TESTING.md).

## Summary

**For daily development:** Use `npm test` (unit tests)
- Fast (~1 second)
- No Docker required
- Test business logic

**Before deployment:** Use `npm run localstack-test` (integration)
- Slower (~30 seconds)
- Requires Docker + LocalStack
- Tests full AWS integration
