#!/bin/bash
set -e

REPO_URL="https://APNpandit611:${GITHUB_PAT}@github.com/APNpandit611/ostrobothnia-nepal-super-league-2026.git"

git remote add github "$REPO_URL" 2>/dev/null || git remote set-url github "$REPO_URL"
git push github main --force
echo "✓ Pushed to GitHub successfully"
