#!/bin/bash
set -e

REPO="APNpandit611/ostrobothnia-nepal-super-league-2026"

# Authenticate via the connected GitHub account (Replit managed integration)
# instead of a stored personal access token (which can expire/become invalid).
# The connectors proxy returns a fresh OAuth token on every run.
if [ -z "$REPLIT_CONNECTORS_HOSTNAME" ]; then
  echo "✗ REPLIT_CONNECTORS_HOSTNAME is not set — cannot reach the connectors service" >&2
  exit 1
fi

if [ -n "$REPL_IDENTITY" ]; then
  AUTH_HEADER="repl $REPL_IDENTITY"
elif [ -n "$WEB_REPL_RENEWAL" ]; then
  AUTH_HEADER="depl $WEB_REPL_RENEWAL"
else
  echo "✗ No REPL_IDENTITY or WEB_REPL_RENEWAL available — cannot authenticate to connectors" >&2
  exit 1
fi

TOKEN=$(curl -s "https://${REPLIT_CONNECTORS_HOSTNAME}/api/v2/connection?include_secrets=true&connector_names=github" \
  -H "Accept: application/json" \
  -H "X_REPLIT_TOKEN: ${AUTH_HEADER}" \
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const d=JSON.parse(s);const c=d.items&&d.items[0];const t=c&&c.settings&&(c.settings.access_token||(c.settings.oauth&&c.settings.oauth.credentials&&c.settings.oauth.credentials.access_token));process.stdout.write(t||'')}catch(e){process.stdout.write('')}})")

if [ -z "$TOKEN" ]; then
  echo "✗ Could not obtain a GitHub access token from the connected account." >&2
  echo "  Make sure the GitHub integration is connected (search integrations for 'GitHub')." >&2
  exit 1
fi

# The environment blocks git commands that write .git/config (e.g. remote add/set-url),
# so push directly to the authenticated URL rather than registering a named remote.
REPO_URL="https://x-access-token:${TOKEN}@github.com/${REPO}.git"

git push "$REPO_URL" main --force
echo "✓ Pushed to GitHub successfully"
