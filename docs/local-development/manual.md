# Manual local development (LocalStack)

This document describes how to run and invoke AWS Lambdas locally using
[LocalStack](https://localstack.cloud/) without deploying to AWS.

This is the **recommended approach** for local Lambda development when not using
the dev container.

This setup is trigger-agnostic and supports non-HTTP-triggered Lambdas
(for example scheduled or batch processing functions)

---

## Prerequisites

You must have the following installed locally:

- Docker (Docker Desktop or Docker Engine)
- AWS CLI v2
- Python 3
- `awslocal`  

install awslocal
  ```bash
  pip install awscli-local
```
verify:
  ```bash
  awslocal --version
```
## Starting LocalStack
```bash
docker run --rm \
  -p 4566:4566 \
  -p 4510-4559:4510-4559 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --name localstack \
  localstack/localstack
```
## Verifying LocalStack

Check LocalStack health:
```bash
curl http://localhost:4566/_localstack/health
```

Expected output should include:
```json
"lambda": "available",
"s3": "available"
```

Check container logs if needed:
```bash
docker logs localstack
```
## Verifying AWS connectivity
LocalStack does not require real AWS credentials.

If not already configured, set dummy values:
```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
```

Verify:
```bash
awslocal sts get-caller-identity
```

Expected:
```json
"Account": "000000000000"
```
## Creating Lambdas locally
Package the Lambda code:
```bash
zip -r fwis-process.zip lib node_modules
```

Create the Lambda:
```bash
awslocal lambda create-function \
  --function-name fwis-process \
  --runtime nodejs18.x \
  --handler fwis-process.handler \
  --role arn:aws:iam::000000000000:role/lambda-role \
  --zip-file fileb://fwis-process.zip
```

Verify:
```bash
awslocal lambda list-functions
```

## Invoking Lambdas
Invoke manually:
```bash
awslocal lambda invoke \
  --function-name fwis-process \
  --payload '{}' \
  response.json
```

View output:
```bash
cat response.json
```

Manual invocation works for any Lambda, regardless of how it is triggered in AWS
(API Gateway, EventBridge, SQS, etc.).

## Local-only configuration
Local-specific environment variables can be configured on the Lambda:
```bash
awslocal lambda update-function-configuration \
  --function-name fwis-process \
  --environment Variables="{IS_LOCALSTACK=true}"
```

Inside the Lambda:
```js
if (process.env.IS_LOCALSTACK) {
  // local-only behaviour
}
```

This flag can be used to:

- Disable real API calls

- Use local database connections

- Return stubbed data

## Stubbing external dependencies
Some Lambdas depend on external services such as:

- FWIS API

- PostgreSQL database

- Other internal APIs

Recommended local approaches:

1. Stub HTTP APIs

Replace real URLs in .env:
```bash
LFW_DATA_FWIS_API_URL=http://localhost:3001/mock-fwis
```

Run a simple mock server (e.g. Express or WireMock).

2. Local database

Run PostgreSQL locally (Docker recommended):
```bash
docker run -d \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=flood_data \
  postgres:16
```

Set connection string:
```bash
LFW_DATA_DB_CONNECTION=postgres://postgres:postgres@localhost:5432/flood_data
```
3. Conditional logic in Lambda

Example pattern used in flood-data:
```js
if (process.env.IS_LOCALSTACK) {
  return { ok: true }
}
```

## Stopping LocalStack

Stop the container:
```bash
docker stop localstack
```

Remove it if needed:
```bash
docker rm localstack
```
Or use the cleanup script:
```bash
./scripts/localstack-teardown.sh
```

---

## LocalStack Integration Testing

For end-to-end testing with real AWS services (S3, Lambda, EventBridge):

### Quick Start

1. **Start LocalStack:**
```bash
docker run --rm -d \
  -p 4566:4566 \
  -p 4510-4559:4510-4559 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --name localstack \
  localstack/localstack
```

2. **Setup environment (deploy lambdas, create S3 buckets, upload fixtures):**
```bash
./scripts/localstack-setup.sh
```

3. **Run integration tests:**
```bash
npm run localstack-test
```

### What's Different from Unit Tests?

**Unit tests** (`npm test`):
- Mock all external dependencies with Sinon
- No Docker required
- Fast, isolated
- Test individual functions

**LocalStack integration tests** (`npm run localstack-test`):
- Deploy real Lambda functions to LocalStack
- Use real S3 buckets and events
- Test end-to-end workflows
- Require Docker running

### Manual Lambda Invocation

After running `./scripts/localstack-setup.sh`, you can manually test:

```bash
# Invoke FWIS lambda
awslocal lambda invoke \
  --function-name fwis-process \
  --payload '{}' \
  response.json

# Invoke RLOI lambda with S3 event
awslocal lambda invoke \
  --function-name rloi-process \
  --payload '{"Records":[{"s3":{"bucket":{"name":"test-flood-data-bucket"},"object":{"key":"rloi/rloi-test.xml"}}}]}' \
  response.json

# View response
cat response.json
```

### Debugging

View LocalStack logs:
```bash
docker logs localstack
```

Check deployed functions:
```bash
awslocal lambda list-functions
```

Check S3 buckets:
```bash
awslocal s3 ls s3://test-flood-data-bucket/
```
