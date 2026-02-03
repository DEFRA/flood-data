# Quick Reference - flood-data Testing

## Daily Development (Unit Tests)

```bash
# Run all unit tests (fast, no Docker)
npm test

# Run specific test file
npm test -- test/unit/functions/fwis-process-new.js

# Check code style
npm run lint

# Auto-fix linting
npx standard --fix
```

**When:** During development, before every commit
**Speed:** ~1 second
**Requirements:** Just Node.js

---

## LocalStack Integration Testing

### First Time Setup

```bash
# 1. Start LocalStack
docker run --rm -d -p 4566:4566 -p 4510-4559:4510-4559 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --name localstack localstack/localstack

# 2. Start PostgreSQL
docker run -d --name postgres-localstack -p 5432:5432 \
  -e POSTGRES_USER=test -e POSTGRES_PASSWORD=test \
  -e POSTGRES_DB=flood_test postgres:16

# 3. Wait for DB
sleep 5

# 4. Create schema
docker exec -i postgres-localstack psql -U test -d flood_test < \
  test/integration/localstack/schema.sql

# 5. Deploy Lambdas
./scripts/localstack-setup.sh

# 6. Run tests
npm run localstack-test
```

### After First Setup

```bash
# Just run the tests (if containers are running)
npm run localstack-test

# Or restart everything
docker start localstack postgres-localstack
./scripts/localstack-setup.sh
npm run localstack-test
```

**When:** Before deploying to AWS, testing infrastructure changes
**Speed:** ~30-60 seconds
**Requirements:** Docker, LocalStack, PostgreSQL

---

## Useful Commands

### Check Status
```bash
# Are containers running?
docker ps | grep -E "localstack|postgres"

# Is LocalStack healthy?
curl http://localhost:4566/_localstack/health

# What Lambdas are deployed?
awslocal lambda list-functions

# Is database ready?
docker exec postgres-localstack pg_isready -U test
```

### Manual Lambda Testing
```bash
# Invoke FWIS lambda
awslocal lambda invoke --function-name fwis-process \
  --payload '{}' response.json
cat response.json

# Invoke RLOI lambda with S3 event
awslocal lambda invoke --function-name rloi-process \
  --payload '{"Records":[{"s3":{"bucket":{"name":"test-flood-data-bucket"},"object":{"key":"rloi/rloi-test.xml"}}}]}' \
  response.json
```

### Debugging
```bash
# View LocalStack logs
docker logs localstack --tail 50

# Check database contents
docker exec postgres-localstack psql -U test -d flood_test \
  -c "SELECT COUNT(*) FROM u_flood.fwis;"

# View Lambda environment
awslocal lambda get-function-configuration \
  --function-name fwis-process
```

### Cleanup
```bash
# Stop everything
docker stop localstack postgres-localstack

# Remove everything
./scripts/localstack-teardown.sh

# Or manual cleanup
docker rm localstack postgres-localstack
docker network rm localstack-network
```

---

## Troubleshooting

### Unit Tests Failing
```bash
# Re-install dependencies
rm -rf node_modules && npm install

# Check Node version
node --version  # Should be 20.x
```

### LocalStack Not Working
```bash
# Is Docker running?
docker ps

# Restart LocalStack
docker restart localstack

# Check logs
docker logs localstack --tail 50
```

### Database Issues
```bash
# Is postgres running?
docker ps | grep postgres

# Recreate schema
docker exec -i postgres-localstack psql -U test -d flood_test < \
  test/integration/localstack/schema.sql
```

### Lambda Not Found
```bash
# Redeploy
./scripts/localstack-setup.sh

# Verify
awslocal lambda list-functions
```

---

## File Locations

| Path | Description |
|------|-------------|
| `lib/functions/` | Lambda handler functions |
| `test/unit/` | Unit test files |
| `test/integration/localstack/` | Integration test files |
| `test/data/` | Test fixtures (XML, JSON) |
| `scripts/localstack-setup.sh` | Deploy to LocalStack |
| `docs/local-development/` | Documentation |

---

## Getting Help

- [Getting Started Guide](GETTING_STARTED.md) - Setup and first run
- [LocalStack Testing Guide](LOCALSTACK_TESTING.md) - Detailed integration testing
- [Manual Setup Guide](manual.md) - Advanced LocalStack usage
