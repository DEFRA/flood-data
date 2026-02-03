#!/bin/bash

echo "Cleaning up LocalStack..."

# Stop and remove LocalStack container
docker stop localstack 2>/dev/null || true
docker rm localstack 2>/dev/null || true

# Clean up temp files
rm -f /tmp/fwis-process.zip
rm -f /tmp/rloi-process.zip
rm -f /tmp/ffoi-process.zip

echo "LocalStack cleanup complete"
