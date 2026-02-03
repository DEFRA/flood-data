#!/bin/bash
set -e

echo "Setting up LocalStack for integration testing..."

# Check if LocalStack is running
if ! curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then
  echo "ERROR: LocalStack is not running!"
  echo "Start LocalStack with:"
  echo "  docker run --rm -d -p 4566:4566 -p 4510-4559:4510-4559 --name localstack localstack/localstack"
  exit 1
fi

echo "LocalStack is running"

# Set AWS credentials for LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566

# Create S3 buckets
echo "Creating S3 buckets..."
awslocal s3 mb s3://test-flood-data-bucket 2>/dev/null || echo "Bucket already exists"

# Upload test fixtures to S3
echo "Uploading test fixtures to S3..."
awslocal s3 cp test/data/rloi-test.xml s3://test-flood-data-bucket/rloi/rloi-test.xml
awslocal s3 cp test/data/ffoi-test.xml s3://test-flood-data-bucket/ffoi/ffoi-test.xml
awslocal s3 cp test/fixtures/fwis.json s3://test-flood-data-bucket/fwis/fwis-test.json

# Package Lambda functions
echo "Packaging Lambda functions..."
zip -rq /tmp/fwis-process.zip lib node_modules package.json test/fixtures test/data
zip -rq /tmp/rloi-process.zip lib node_modules package.json test/fixtures test/data
zip -rq /tmp/ffoi-process.zip lib node_modules package.json test/fixtures test/data

# Create IAM role (required even though LocalStack doesn't enforce permissions)
echo "Creating IAM role..."
awslocal iam create-role \
  --role-name lambda-execution-role \
  --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}' \
  2>/dev/null || echo "Role already exists"

ROLE_ARN="arn:aws:iam::000000000000:role/lambda-execution-role"

# Ensure containers are on the same network
docker network create localstack-network 2>/dev/null || true
docker network connect localstack-network postgres-localstack 2>/dev/null || true
docker network connect localstack-network localstack 2>/dev/null || true

# Get postgres IP on the shared network
POSTGRES_IP=$(docker network inspect localstack-network -f '{{range .Containers}}{{if eq .Name "postgres-localstack"}}{{.IPv4Address}}{{end}}{{end}}' | cut -d'/' -f1)

if [ -z "$POSTGRES_IP" ]; then
  echo "ERROR: Could not find postgres-localstack on network"
  echo "Make sure PostgreSQL is running: docker run -d --name postgres-localstack -p 5432:5432 -e POSTGRES_USER=test -e POSTGRES_PASSWORD=test -e POSTGRES_DB=flood_test postgres:16"
  exit 1
fi

echo "Using PostgreSQL at: $POSTGRES_IP"
DB_CONNECTION="postgres://test:test@${POSTGRES_IP}:5432/flood_test"

# Create Lambda functions
echo "Creating Lambda functions..."

# FWIS Process Lambda
awslocal lambda delete-function --function-name fwis-process 2>/dev/null || true
awslocal lambda create-function \
  --function-name fwis-process \
  --runtime nodejs20.x \
  --handler lib/functions/fwis-process.handler \
  --role $ROLE_ARN \
  --zip-file fileb:///tmp/fwis-process.zip \
  --environment Variables="{IS_LOCALSTACK=true,LFW_DATA_DB_CONNECTION=${DB_CONNECTION}}" \
  --timeout 30

# RLOI Process Lambda
awslocal lambda delete-function --function-name rloi-process 2>/dev/null || true
awslocal lambda create-function \
  --function-name rloi-process \
  --runtime nodejs20.x \
  --handler lib/functions/rloi-process.handler \
  --role $ROLE_ARN \
  --zip-file fileb:///tmp/rloi-process.zip \
  --environment Variables="{IS_LOCALSTACK=true,LFW_DATA_DB_CONNECTION=${DB_CONNECTION}}" \
  --timeout 30

# FFOI Process Lambda
awslocal lambda delete-function --function-name ffoi-process 2>/dev/null || true
awslocal lambda create-function \
  --function-name ffoi-process \
  --runtime nodejs20.x \
  --handler lib/functions/ffoi-process.handler \
  --role $ROLE_ARN \
  --zip-file fileb:///tmp/ffoi-process.zip \
  --environment Variables="{IS_LOCALSTACK=true,LFW_DATA_DB_CONNECTION=${DB_CONNECTION}}" \
  --timeout 30

echo "LocalStack setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run integration tests: npm run localstack-test"
echo "  2. Manually invoke a lambda: awslocal lambda invoke --function-name fwis-process --payload '{}' response.json"
echo "  3. Check logs: docker logs localstack"
