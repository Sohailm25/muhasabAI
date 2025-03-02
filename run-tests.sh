#!/bin/bash

# Script to run tests for the SahabAI privacy profile system

# Colors for better output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function for displaying help
function display_help {
  echo -e "${BLUE}SahabAI Profile System Test Runner${NC}"
  echo "Usage: ./run-tests.sh [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  -a, --all         Run all tests"
  echo "  -u, --unit        Run only unit tests"
  echo "  -i, --integration Run only integration tests"
  echo "  -s, --security    Run only security tests"
  echo "  -c, --coverage    Generate test coverage report"
  echo "  -w, --watch       Run tests in watch mode"
  echo "  -h, --help        Display this help message"
  echo ""
  echo "Examples:"
  echo "  ./run-tests.sh --unit         # Run unit tests only"
  echo "  ./run-tests.sh -i -c          # Run integration tests with coverage"
  echo "  ./run-tests.sh --all --watch  # Run all tests in watch mode"
}

# Parse command line arguments
ALL=false
UNIT=false
INTEGRATION=false
SECURITY=false
COVERAGE=false
WATCH=false

# If no arguments provided, run all tests
if [ $# -eq 0 ]; then
  ALL=true
fi

# Parse arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -a|--all)
      ALL=true
      shift
      ;;
    -u|--unit)
      UNIT=true
      shift
      ;;
    -i|--integration)
      INTEGRATION=true
      shift
      ;;
    -s|--security)
      SECURITY=true
      shift
      ;;
    -c|--coverage)
      COVERAGE=true
      shift
      ;;
    -w|--watch)
      WATCH=true
      shift
      ;;
    -h|--help)
      display_help
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $key${NC}"
      display_help
      exit 1
      ;;
  esac
done

# Set test path based on options
TEST_PATH=""

if [ "$ALL" = true ]; then
  echo -e "${GREEN}Running all tests...${NC}"
  TEST_PATH="tests/"
else
  # Build test path based on selected options
  if [ "$UNIT" = true ]; then
    TEST_PATH="${TEST_PATH} tests/unit/"
  fi
  
  if [ "$INTEGRATION" = true ]; then
    TEST_PATH="${TEST_PATH} tests/integration/ tests/api/"
  fi
  
  if [ "$SECURITY" = true ]; then
    TEST_PATH="${TEST_PATH} tests/security/"
  fi
  
  # If no specific test type selected but not ALL, run unit tests by default
  if [ -z "$TEST_PATH" ]; then
    echo -e "${YELLOW}No test type specified, running unit tests by default...${NC}"
    TEST_PATH="tests/unit/"
  fi
fi

# Build the test command
TEST_CMD="npm test"

if [ "$WATCH" = true ]; then
  TEST_CMD="npm run test:watch"
fi

if [ "$COVERAGE" = true ]; then
  TEST_CMD="npm run test:coverage"
fi

# Run the tests
echo -e "${BLUE}Running tests for: ${TEST_PATH}${NC}"
if [ -n "$TEST_PATH" ]; then
  # Add the path to the test command
  $TEST_CMD -- $TEST_PATH
else
  # Run without specific path
  $TEST_CMD
fi

# Exit with the exit code from the test command
exit $? 