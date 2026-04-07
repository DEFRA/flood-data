#!/bin/bash
# Test script to verify duplicate rainfall detection across separate XML files
# This script runs rloi-process twice with the same station reference but different XML files
# Expected behavior: First run inserts parent, second run skips it (ON CONFLICT)

set -e

# Ensure we're running from the repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$REPO_ROOT"

STATION_REF="TEST_DUP_12345"
DB_CONNECTION="postgres://u_flood:secret@127.0.0.1:5433/temp_flood_db"

echo "========================================"
echo "Testing Duplicate Detection Across Files"
echo "========================================"
echo ""
echo "Using fixed station reference: $STATION_REF"
echo "Database: $DB_CONNECTION"
echo ""

echo "--- RUN 1: Processing rloi-test.xml ---"
echo "Expected: Parent should be inserted (1 row)"
DEBUG_STATION_REF="$STATION_REF" \
DEBUG_XML_FILE="./test/data/rloi-test.xml" \
LFW_DATA_DB_CONNECTION="$DB_CONNECTION" \
node test/debug-rloi-local.js

echo ""
echo "--- RUN 2: Processing rloi-test-rainfall-duplicate.xml ---"
echo "Expected: Parent should NOT be inserted (0 rows) - ON CONFLICT DO NOTHING"
DEBUG_STATION_REF="$STATION_REF" \
DEBUG_XML_FILE="./test/data/rloi-test-rainfall-duplicate.xml" \
LFW_DATA_DB_CONNECTION="$DB_CONNECTION" \
node test/debug-rloi-local.js

echo ""
echo "========================================"
echo "Duplicate test complete!"
echo "Check the logs above to verify:"
echo "  Run 1: 1 parent inserted"
echo "  Run 2: 0 parents inserted (duplicate blocked)"
echo "========================================"
