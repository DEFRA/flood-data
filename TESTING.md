# Testing Guide

This project uses two complementary testing strategies.

## Unit Tests (Fast - Recommended for Daily Development)

**Run:** `npm test`

**Speed:** ~1 second  
**Requirements:** Node.js only  
**What's Mocked:** Everything (S3, database, HTTP requests, etc.)

### When to Use
- During development (every code change)
- Before committing code
- In CI/CD pipelines
- For fast feedback on logic correctness

### Example
```bash
# Run all unit tests
npm test

# Run specific test file
npm test -- test/unit/functions/fwis-process-new.js

# Watch mode (re-run on changes)
npm test -- --watch
```

### What's Being Tested
- Individual function behavior
- Data transformations
- Error handling
- Business logic

---

## LocalStack Integration Tests (Slower - Use Before Deployment)

**Run:** `npm run localstack-test`

**Speed:** ~30-60 seconds  
**Requirements:** Docker, LocalStack, PostgreSQL  
**What's Real:** Lambda execution, S3, database writes

### When to Use
- Before deploying to AWS
- Testing infrastructure changes
- Validating AWS service integration
- End-to-end workflow verification

### Setup Required

#### First Time Only
```bash
# 1. Start LocalStack
docker run --rm -d -p 4566:4566 -p 4510-4559:4510-4559 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --name localstack localstack/localstack

# 2. Start PostgreSQL
docker run -d --name postgres-localstack -p 5432:5432 \
  -e POSTGRES_USER=test -e POSTGRES_PASSWORD=test \
  -e POSTGRES_DB=flood_test postgres:16

# 3. Create database schema
sleep 5
docker exec -i postgres-localstack psql -U test -d flood_test < \
  test/integration/localstack/schema.sql

# 4. Deploy Lambdas
./scripts/localstack-setup.sh
```

#### Subsequent Runs
```bash
# If containers are running, just:
npm run localstack-test

# Or redeploy if code changed:
./scripts/localstack-setup.sh
npm run localstack-test
```

### What's Being Tested
- Lambda packaging and deployment
- S3 event handling
- Database writes
- Full data processing flow
- AWS SDK integration

---

## Quick Comparison

| Aspect | Unit Tests | LocalStack Tests |
|--------|-----------|------------------|
| **Speed** | ~1 second | ~30-60 seconds |
| **Setup** | None | Docker containers |
| **Scope** | Functions in isolation | End-to-end Lambda execution |
| **Dependencies** | All mocked | Real LocalStack + DB |
| **Use Case** | Daily development | Pre-deployment validation |
| **Cost** | Free (local CPU only) | Free (local Docker) |

---

## Recommended Workflow

```
┌─────────────────────────────────────┐
│  Write/Modify Code                   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  npm test (Unit Tests)              │
│  Fast feedback on logic              │
└──────────────┬──────────────────────┘
               │
               ▼
         Tests Pass?
               │
               ├──No──> Fix Issues
               │
              Yes
               │
               ▼
┌─────────────────────────────────────┐
│  npm run lint                        │
│  Check code style                    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Commit Changes                      │
└──────────────┬──────────────────────┘
               │
               ▼
     Before Deploying?
               │
              Yes
               │
               ▼
┌─────────────────────────────────────┐
│  npm run localstack-test            │
│  Full integration validation         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Deploy to AWS                       │
└─────────────────────────────────────┘
```

---

## More Information

- **[Getting Started](docs/local-development/GETTING_STARTED.md)** - Setup guide
- **[LocalStack Testing](docs/local-development/LOCALSTACK_TESTING.md)** - Detailed integration test guide
- **[Quick Reference](docs/local-development/QUICK_REFERENCE.md)** - Command cheat sheet
- **[Manual Setup](docs/local-development/manual.md)** - Advanced LocalStack usage

---

## Troubleshooting

### Unit Tests Fail
```bash
# Re-install dependencies
rm -rf node_modules && npm install

# Verify Node version
node --version  # Should be 20.x
```

### LocalStack Tests Fail
```bash
# Check containers are running
docker ps | grep -E "localstack|postgres"

# Restart containers
docker restart localstack postgres-localstack

# Redeploy Lambdas
./scripts/localstack-setup.sh

# Run tests again
npm run localstack-test
```

### Need Help?
See [docs/local-development/LOCALSTACK_TESTING.md](docs/local-development/LOCALSTACK_TESTING.md) for comprehensive troubleshooting.
