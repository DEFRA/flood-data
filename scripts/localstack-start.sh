#!/bin/bash
set -e

echo "=== Starting LocalStack Integration Test Environment ==="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "ERROR: Docker is not running. Please start Docker first."
  exit 1
fi

# Start LocalStack
echo "Starting LocalStack..."
docker compose -f docker-compose.localstack.yml up -d

# Wait for LocalStack to be ready
echo "Waiting for LocalStack to be ready..."
for i in {1..30}; do
  if curl -s http://localhost:4566/_localstack/health | grep -q '"lambda": "available"'; then
    echo "✓ LocalStack is ready"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "ERROR: LocalStack failed to start"
    exit 1
  fi
  sleep 1
done

# Optional: Start PostgreSQL
read -p "Do you want to start PostgreSQL for database tests? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Starting PostgreSQL..."
  docker run -d \
    -p 5432:5432 \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=flood_data \
    --name postgres-test \
    postgres:16 2>/dev/null || echo "PostgreSQL container already exists"
  echo "✓ PostgreSQL started"
fi

echo ""
echo "=== Environment Ready ==="
echo "LocalStack: http://localhost:4566"
echo "PostgreSQL: localhost:5432 (if started)"
echo ""
echo "Run tests with: npm run localstack-test"
echo "Stop with: ./scripts/localstack-stop.sh"
