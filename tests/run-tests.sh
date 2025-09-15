#!/bin/bash

# Multi-Tenant Notes SaaS Test Script
# Usage: ./tests/run-tests.sh [API_BASE_URL] [FRONTEND_URL]

API_BASE_URL=${1:-"http://localhost:3000"}
FRONTEND_URL=${2:-"http://localhost:3000"}

echo "Running tests against:"
echo "API: $API_BASE_URL"
echo "Frontend: $FRONTEND_URL"
echo ""

export API_BASE_URL=$API_BASE_URL
export FRONTEND_URL=$FRONTEND_URL

node tests/run-tests.js