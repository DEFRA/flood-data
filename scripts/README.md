# LocalStack Scripts

Helper scripts for LocalStack integration testing.

## localstack-setup.sh

Deploys Lambda functions and configures LocalStack environment.

**What it does:**
- Checks LocalStack is running
- Creates S3 buckets
- Uploads test fixtures to S3
- Packages Lambda functions
- Creates IAM roles
- Deploys Lambda functions with IS_LOCALSTACK=true

**Usage:**
```bash
./scripts/localstack-setup.sh
```

## localstack-teardown.sh

Cleans up LocalStack containers and temp files.

**Usage:**
```bash
./scripts/localstack-teardown.sh
```

## Quick Commands

Using make:
```bash
make localstack-start    # Start LocalStack
make localstack-setup    # Deploy lambdas
make localstack-test     # Run integration tests
make localstack-clean    # Clean up
make localstack-full     # Do all of the above
```

Or manually:
```bash
# Start
docker run --rm -d -p 4566:4566 --name localstack localstack/localstack

# Setup
./scripts/localstack-setup.sh

# Test
npm run localstack-test

# Cleanup
./scripts/localstack-teardown.sh
```
