#!/bin/bash

# Downloads Java dependencies (Jackson) for the integration libs.
# Runs automatically via `bun install` (postinstall hook).

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LIB_DIR="$SCRIPT_DIR/../.java-integration-libs/lib"
JACKSON_VERSION="2.18.2"
MAVEN_BASE="https://repo1.maven.org/maven2/com/fasterxml/jackson/core"

JARS=(
  "jackson-core:$MAVEN_BASE/jackson-core/$JACKSON_VERSION/jackson-core-$JACKSON_VERSION.jar"
  "jackson-annotations:$MAVEN_BASE/jackson-annotations/$JACKSON_VERSION/jackson-annotations-$JACKSON_VERSION.jar"
  "jackson-databind:$MAVEN_BASE/jackson-databind/$JACKSON_VERSION/jackson-databind-$JACKSON_VERSION.jar"
)

mkdir -p "$LIB_DIR"

ALL_PRESENT=true
for entry in "${JARS[@]}"; do
  name="${entry%%:*}"
  if ! ls "$LIB_DIR"/${name}-*.jar 1>/dev/null 2>&1; then
    ALL_PRESENT=false
    break
  fi
done

if [ "$ALL_PRESENT" = true ]; then
  echo "✓ Java dependencies already installed."
  exit 0
fi

echo "Downloading Java dependencies (Jackson $JACKSON_VERSION)..."
for entry in "${JARS[@]}"; do
  name="${entry%%:*}"
  url="${entry#*:}"
  filename=$(basename "$url")
  if [ ! -f "$LIB_DIR/$filename" ]; then
    echo "  ↓ $filename"
    curl -sL -o "$LIB_DIR/$filename" "$url"
  fi
done

echo "✓ Java dependencies installed to .java-integration-libs/lib/"
