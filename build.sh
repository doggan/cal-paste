#!/bin/bash
set -e

./use-prod.sh

zip -r ../cal-paste.zip . \
  --exclude "*.git*" \
  --exclude "manifest.dev.json" \
  --exclude "use-dev.sh" \
  --exclude "use-prod.sh" \
  --exclude "build.sh" \
  --exclude "*.DS_Store" \
  --exclude "*.idea*" \
  --exclude ".claude*" \
  --exclude "CLAUDE.md" \
  --exclude "README.md" \
  --exclude "CHANGELOG.md"

SIZE=$(du -sh ../cal-paste.zip | cut -f1)
echo "Built ../cal-paste.zip ($SIZE)"
