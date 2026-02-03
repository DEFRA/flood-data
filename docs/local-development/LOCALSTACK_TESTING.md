# LocalStack Integration Testing

Complete guide for running integration tests against LocalStack (local AWS environment).

## Overview

This project has two types of tests:

| Test Type | Command | Requires Docker | What's Tested | Speed |
|-----------|---------|----------------|---------------|-------|
| **Unit Tests** | `npm test` | No | Individual functions with mocked dependencies | Fast (~1s) |
| **LocalStack Integration** | `npm run localstack-test` | Yes | End-to-end Lambda execution with real S3/DB | Slow (~30s) |

## Prerequisites

Before you begin, ensure you have:

- **Docker** - For running LocalStack and PostgreSQL
- **Node.js 20.x** - For running the Lambda code
- **awscli-local** - CLI tool for LocalStack
  ```bash
  pip install awscli-local
  ```
- **AWS CLI** - Standard AWS CLI (v2)

Verify installation:
```bash
docker --version
node --version
awslocal --version
```

## Quick Start (TL;DR)

```bash
# 1. Start LocalStack
docker run --rm -d -p 4566:4566 -p 4510-4559:4510-4559 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --name localstack localstack/localstack

# 2. Start PostgreSQL (for database integration)
docker run -d --name postgres-localstack -p 5432:5432 \
  -e POSTGRES_USER=test -e POSTGRES_PASSWORD=test \
  -e POSTGRES_DB=flood_test postgres:16

# 3. Wait for database to be ready
sleep 5

# 4. Create database schema
docker exec -i postgres-localstack psql -U test -d flood_test < \
  test/integration/localstack/schema.sql

# 5. Deploy Lambdas to LocalStack
./scripts/localstack-setup.sh

# 6. Run integration tests
npm run localstack-test
```

## Detailed Setup Steps

### Step 1: Start LocalStack

LocalStack provides local AWS services (Lambda, S3, EventBridge, etc.).

**Option A: Docker Run**
```bash
docker run --rm -d \
  -p 4566:4566 \
  -p 4510-4559:4510-4559 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --name localstack \
  localstack/localstack
```

**Option B: Docker Compose**
```bash
docker compose -f docker-compose.localstack.yml up -d
```

**Verify it's running:**
```bash
curl http://localhost:4566/_localstack/health
# Should show: "lambda": "available", "s3": "available"
```

### Step 2: Start PostgreSQL Database

The Lambda functions write to a PostgreSQL database. For full integration testing:

```bash
docker run -d \
  --name postgres-localstack \
  -p 5432:5432 \
  -e POSTGRES_USER=test \
  -e POSTGRES_PASSWORD=test \
  -e POSTGRES_DB=flood_test \
  postgres:16
```

**Wait for PostgreSQL to be ready:**
```bash
sleep 5
docker exec postgres-localstack pg_isready -U test
# Should show: "accepting connections"
```

### Step 3: Create Database Schema

Create the required tables and views:

```bash
docker exec -i postgres-localstack psql -U test -d flood_test < \
  test/integration/localstack/schema.sql
```

**Verify schema creation:**
```bash
docker exec postgres-localstack psql -U test -d flood_test -c "\dt u_flood.*"
# Should list tables: fwis, current_fwis, sls_telemetry_value, etc.
```

### Step 4: Deploy Lambda Functions

The setup script will:
- Create S3 buckets
- Upload test fixtures to S3
- Package Lambda functions (with test data included)
- Deploy 3 Lambdas to LocalStack
- Configure environment variables
- Set up Docker networking

```bash
chmod +x scripts/localstack-setup.sh
./scripts/localstack-setup.sh
```

**Verify deployment:**
```bash
awslocal lambda list-functions
# Should list: fwis-process, rloi-process, ffoi-process
```

### Step 5: Run Integration Tests

```bash
npm run localstack-test
```

This will:
- Deploy Lambdas if needed
- Invoke each Lambda via AWS SDK
- Verify responses
- Check database writes (if applicable)

## How IS_LOCALSTACK Works

### In Lambda Code

```javascript
if (process.env.IS_LOCALSTACK === 'true') {
  // Load fixture data from disk
  const fixturePath = path.join(__dirname, '../../test/data/rloi-test.xml')
  bodyContents = fs.readFileSync(fixturePath, 'utf8')
} else {
  // Load from real AWS S3
  const data = await s3.getObject({ Bucket: bucket, Key: key })
  bodyContents = await data.Body.transformToString()
}
```

### Why Both LocalStack S3 AND Fixtures?

- **LocalStack S3 works** - you can read from it
- **Fixtures are faster** - no S3 SDK calls needed
- **More portable** - works even if S3 setup changes
- **Hybrid approach** - test S3 events + Lambda processing separately

## Manual Testing

After setup, manually invoke Lambdas:

```bash
# Test FWIS lambda
awslocal lambda invoke \
  --function-name fwis-process \
  --payload '{}' \
  response.json

# Test RLOI lambda with S3 event
awslocal lambda invoke \
  --function-name rloi-process \
  --payload '{"Records":[{"s3":{"bucket":{"name":"test-flood-data-bucket"},"object":{"key":"rloi/rloi-test.xml"}}}]}' \
  response.json

cat response.json
```

## Debugging

```bash
# Check LocalStack health
curl http://localhost:4566/_localstack/health

# View logs
docker logs localstack

# List deployed functions
awslocal lambda list-functions

# Check S3 contents
awslocal s3 ls s3://test-flood-data-bucket/ --recursive
```

## Cleanup

### Quick Cleanup
```bash
./scripts/localstack-teardown.sh
```

### Manual Cleanup
```bash
# Stop and remove containers
docker stop localstack postgres-localstack
docker rm localstack postgres-localstack

# Remove network
docker network rm localstack-network

# Clean up temp files
rm -f /tmp/fwis-process.zip /tmp/rloi-process.zip /tmp/ffoi-process.zip
rm -f response.json
```

### Reset Everything
```bash
# Full reset - removes all containers and data
docker stop localstack postgres-localstack
docker rm localstack postgres-localstack
docker network rm localstack-network
docker volume prune -f

# Then start fresh from Step 1
```

## Adding New Integration Tests

1. Create test file: `test/integration/localstack/your-lambda.js`
2. Use AWS SDK to invoke lambda:
   ```javascript
   const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda')
   
   const lambdaClient = new LambdaClient({
     endpoint: 'http://localhost:4566',
     region: 'us-east-1',
     credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
   })
   ```
3. Add lambda to `scripts/localstack-setup.sh`
4. Add fixture data to `test/data/` or `test/fixtures/`

## Understanding the Test Flow

### How IS_LOCALSTACK Works

When `IS_LOCALSTACK=true` is set as an environment variable on the Lambda:

**fwis-process.js:**
```javascript
if (process.env.IS_LOCALSTACK === 'true') {
  // Load fixture data from filesystem instead of calling external API
  const file = path.join(__dirname, '../../test/data/fwis.json')
  warnings = JSON.parse(fs.readFileSync(file))
} else {
  // Production: call real FWIS API
  const response = await wreck.request('get', process.env.LFW_DATA_FWIS_API_URL, ...)
  warnings = response.warnings
}
```

**rloi-process.js:**
```javascript
if (process.env.IS_LOCALSTACK === 'true') {
  // Load fixture XML from filesystem instead of S3
  const fixturePath = path.join(__dirname, '../../test/data/rloi-test.xml')
  bodyContents = fs.readFileSync(fixturePath, 'utf8')
} else {
  // Production: fetch from real S3
  const data = await s3.getObject({ Bucket: bucket, Key: key })
  bodyContents = await data.Body.transformToString()
}
```

### What Gets Tested

1. **Lambda Deployment** - Functions package and deploy correctly
2. **Environment Configuration** - Variables are set properly
3. **Fixture Data Loading** - Test data is accessible in Lambda environment
4. **Business Logic** - Data processing code runs correctly
5. **Database Integration** - Data is written to PostgreSQL (if DB is running)
6. **AWS SDK Integration** - Lambda invocation via SDK works

## Performance Considerations

### Lambda Timeout

LocalStack Lambda execution can be slower than AWS. The current timeout is 30 seconds.

**Known Issues:**
- Large database writes may timeout
- First invocation (cold start) is slower
- Docker networking adds latency

**Solutions:**
- Use smaller test fixtures
- Increase Lambda timeout: `--timeout 60`
- Stub database writes for faster tests

### Test Execution Time

Expect:
- **Unit tests**: ~1 second (all mocked)
- **LocalStack tests**: ~30-60 seconds (full integration)

## Manual Testing

After setup, you can manually invoke Lambdas:

### Test FWIS Lambda
```bash
awslocal lambda invoke \
  --function-name fwis-process \
  --payload '{}' \
  response.json

cat response.json
```

### Test RLOI Lambda with S3 Event
```bash
awslocal lambda invoke \
  --function-name rloi-process \
  --payload '{
    "Records": [{
      "s3": {
        "bucket": {"name": "test-flood-data-bucket"},
        "object": {"key": "rloi/rloi-test.xml"}
      }
    }]
  }' \
  response.json

cat response.json
```

### Check Database After Lambda Execution
```bash
# Check FWIS warnings were inserted
docker exec postgres-localstack psql -U test -d flood_test \
  -c "SELECT COUNT(*) FROM u_flood.fwis;"

# Check telemetry values
docker exec postgres-localstack psql -U test -d flood_test \
  -c "SELECT COUNT(*) FROM u_flood.sls_telemetry_value;"
```

## Troubleshooting

### "LocalStack is not running"
```bash
docker ps | grep localstack
# If not running:
docker start localstack
# Or start fresh:
docker run --rm -d -p 4566:4566 --name localstack localstack/localstack
```

### "PostgreSQL connection failed"
```bash
# Check postgres is running
docker ps | grep postgres-localstack

# Check if database is ready
docker exec postgres-localstack pg_isready -U test

# Verify network connectivity
docker network inspect localstack-network
```

### "Function not found"
```bash
# List deployed functions
awslocal lambda list-functions

# If missing, re-run setup
./scripts/localstack-setup.sh
```

### "Cannot connect to Docker"
```bash
# Check Docker daemon is running
docker ps

# On Linux, you may need
sudo systemctl start docker
```

### "Tests timing out"
```bash
# Increase Lambda timeout
awslocal lambda update-function-configuration \
  --function-name fwis-process \
  --timeout 60

# Or run with longer test timeout
npm run localstack-test -- --timeout 120000
```

### "Database schema errors"
```bash
# Re-create schema
docker exec postgres-localstack psql -U test -d flood_test \
  -c "DROP SCHEMA u_flood CASCADE; CREATE SCHEMA u_flood;"

docker exec -i postgres-localstack psql -U test -d flood_test < \
  test/integration/localstack/schema.sql
```

### View LocalStack Logs
```bash
# Real-time logs
docker logs localstack -f

# Last 50 lines
docker logs localstack --tail 50

# Search for errors
docker logs localstack 2>&1 | grep -i error
```
