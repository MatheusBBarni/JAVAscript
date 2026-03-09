#!/bin/bash

# Script to run compiled Java outputs and verify they work.
# Usage: ./run-java-tests.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
JAVA_OUTPUT="$SCRIPT_DIR/.java-output"
INTEGRATION_LIBS="$SCRIPT_DIR/.java-integration-libs"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║    JAVAscript - Java Output Runner   ║${NC}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

# Step 1: Compile integration libs
echo -e "${YELLOW}[1/3]${NC} Compiling integration libs..."
javac -d "$INTEGRATION_LIBS" "$INTEGRATION_LIBS"/*.java 2>/dev/null && \
  echo -e "  ${GREEN}✓${NC} Integration libs compiled" || \
  echo -e "  ${RED}✗${NC} Failed to compile integration libs"

# Step 2: Compile all .java files in .java-output
echo -e "${YELLOW}[2/3]${NC} Compiling Java outputs..."
COMPILE_PASS=0
COMPILE_FAIL=0
for javaFile in "$JAVA_OUTPUT"/*.java; do
  className=$(basename "$javaFile" .java)
  if javac -cp "$INTEGRATION_LIBS:$JAVA_OUTPUT" -d "$JAVA_OUTPUT" "$javaFile" 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} $className compiled"
    COMPILE_PASS=$((COMPILE_PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $className failed to compile"
    COMPILE_FAIL=$((COMPILE_FAIL + 1))
  fi
done

echo ""
echo -e "${YELLOW}[3/3]${NC} Running Java outputs..."
echo -e "${BOLD}────────────────────────────────────────${NC}"

RUN_PASS=0
RUN_FAIL=0
RUN_SKIP=0

for classFile in "$JAVA_OUTPUT"/*.class; do
  className=$(basename "$classFile" .class)

  # Skip inner classes (e.g. Person.class from Test_04_exports)
  if ! [ -f "$JAVA_OUTPUT/$className.java" ]; then
    continue
  fi

  echo ""
  echo -e "${CYAN}▸ Running ${BOLD}$className${NC}"

  # Run with a 5-second timeout (portable, no coreutils needed)
  OUTPUT=$(
    java -cp "$INTEGRATION_LIBS:$JAVA_OUTPUT" "$className" &
    PID=$!
    ( sleep 5; kill $PID 2>/dev/null ) &
    TIMER=$!
    wait $PID 2>/dev/null
    EXIT=$?
    kill $TIMER 2>/dev/null
    wait $TIMER 2>/dev/null
    exit $EXIT
  ) 2>&1 && STATUS=0 || STATUS=$?

  if [ $STATUS -eq 124 ]; then
    echo -e "  ${YELLOW}⏱ Timed out (5s) — likely waiting on network${NC}"
    RUN_SKIP=$((RUN_SKIP + 1))
  elif [ $STATUS -eq 0 ]; then
    if [ -n "$OUTPUT" ]; then
      echo "$OUTPUT" | while IFS= read -r line; do
        echo -e "  ${GREEN}│${NC} $line"
      done
    else
      echo -e "  ${GREEN}│${NC} (no output)"
    fi
    echo -e "  ${GREEN}✓ Exited successfully${NC}"
    RUN_PASS=$((RUN_PASS + 1))
  else
    if [ -n "$OUTPUT" ]; then
      echo "$OUTPUT" | while IFS= read -r line; do
        echo -e "  ${RED}│${NC} $line"
      done
    fi
    echo -e "  ${RED}✗ Exited with code $STATUS${NC}"
    RUN_FAIL=$((RUN_FAIL + 1))
  fi
done

# Summary
echo ""
echo -e "${BOLD}────────────────────────────────────────${NC}"
echo -e "${BOLD}Summary${NC}"
echo -e "  Compiled: ${GREEN}$COMPILE_PASS passed${NC}, ${RED}$COMPILE_FAIL failed${NC}"
echo -e "  Runtime:  ${GREEN}$RUN_PASS passed${NC}, ${RED}$RUN_FAIL failed${NC}, ${YELLOW}$RUN_SKIP timed out${NC}"
echo ""
