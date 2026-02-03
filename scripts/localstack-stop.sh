#!/bin/bash
set -e

echo "=== Stopping LocalStack Environment ==="

# Stop LocalStack
echo "Stopping LocalStack..."
docker compose -f docker-compose.localstack.yml down

# Stop PostgreSQL if running
if docker ps -a | grep -q postgres-test; then
  echo "Stopping PostgreSQL..."
  docker stop postgres-test 2>/dev/null || true
  docker rm postgres-test 2>/dev/null || true
  echo "✓ PostgreSQL stopped"
fi

echo "✓ Environment stopped"
