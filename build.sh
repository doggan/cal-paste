#!/bin/bash
set -e

./use-prod.sh

zip -r ../cal-paste.zip . \
  --exclude "*.git*" \
  --exclude "manifest.dev.json" \
  --exclude "use-dev.sh" \
  --exclude "use-prod.sh" \
  --exclude "build.sh" \
  --exclude "*.DS_Store"

echo "Built ../cal-paste.zip"
