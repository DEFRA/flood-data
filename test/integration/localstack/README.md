# LocalStack Integration Tests

These tests run against a real LocalStack instance, testing the lambdas with actual S3 events and AWS SDK calls.

## Prerequisites

1. **Docker** must be running
2. **LocalStack** container must be running
3. **PostgreSQL** (optional - stubs can be used)

## Setup

### 1. Start LocalStack

```bash
docker compose -f docker-compose.localstack.yml up -d
```

Verify it's running:
```bash
curl http://localhost:4566/_localstack/health
```

### 2. (Optional) Start PostgreSQL

If you want to test database operations:
```bash
docker run -d \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=flood_data \
  --name postgres-test \
  postgres:16
```

## Running Tests

Run all LocalStack integration tests:
```bash
npm run localstack-test
```

Run specific test:
```bash
lab test/integration/localstack/fwis-process.test.js -v
```

## What These Tests Do

1. **Setup phase** (`setup.js`):
   - Creates S3 bucket in LocalStack
   - Uploads test XML files to S3
   - Deploys Lambda functions to LocalStack
   - Configures environment variables

2. **Test phase**:
   - Invokes Lambdas via AWS SDK
   - Sends real S3 events
   - Tests actual file processing
   - Verifies responses

## Key Differences from Unit Tests

| Aspect | Unit Tests | LocalStack Integration |
|--------|-----------|------------------------|
| Dependencies | Mocked with Sinon | Real LocalStack services |
| S3 | Stubbed | Real LocalStack S3 |
| Lambda | Direct function call | AWS SDK invoke |
| Speed | Fast (~1s) | Slower (~10s) |
| Setup | None | Docker + deployment |

## Troubleshooting

**Lambda not found:**
```bash
# List deployed lambdas
awslocal lambda list-functions
```

**S3 issues:**
```bash
# List buckets and objects
awslocal s3 ls
awslocal s3 ls s3://test-flood-data-bucket/
```

**View Lambda logs:**
```bash
docker logs localstack 2>&1 | grep fwis-process
```

**Clean up:**
```bash
docker compose -f docker-compose.localstack.yml down
docker rm postgres-test
```
