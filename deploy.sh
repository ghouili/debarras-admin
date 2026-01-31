#!/usr/bin/env bash
set -euo pipefail

#############################################
# CONFIG (overridable from SSH env vars)
#############################################
APP_DIR="${APP_DIR:-/var/www/debarras/admin}"
APP_SUBDIR="${APP_SUBDIR:-.}"          # for monorepo support
BRANCH="${BRANCH:-production}"
REPO_URL="${REPO_URL:-}"

ENV_FILE="$APP_DIR/.env"
ENV_PAYLOAD_PATH="${ENV_PAYLOAD_PATH:-/tmp/admin.env}"
ENV_EXAMPLE_FILE="$APP_DIR/.env.example"

PM2_APP="${PM2_APP:-admin}"
APP_PORT="${APP_PORT:-3001}"

NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

log() { printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }

#############################################
# LOAD NODE (NVM)
#############################################
if [ -f "$NVM_DIR/nvm.sh" ]; then
  log "Loading NVM from $NVM_DIR"
  # shellcheck disable=SC1091
  source "$NVM_DIR/nvm.sh"
else
  log "NVM not found at $NVM_DIR, using system node"
fi

log "Node: $(node -v || echo 'Not found')"
log "NPM:  $(npm -v || echo 'Not found')"

#############################################
# FIRST DEPLOY OR UPDATE
#############################################
log "Using app directory: $APP_DIR"
mkdir -p "$APP_DIR"
cd "$APP_DIR"

if [[ ! -d "$APP_DIR/.git" ]]; then
  if [[ -z "$REPO_URL" ]]; then
    log "ERROR: REPO_URL is empty. Provide REPO_URL via workflow."
    exit 1
  fi

  TMP_CLONE="/tmp/admin_clone_$$"
  log "First deploy → cloning into: $TMP_CLONE"
  git clone --branch "$BRANCH" "$REPO_URL" "$TMP_CLONE"

  log "Copying project to $APP_DIR"
  rsync -a --delete "$TMP_CLONE/" "$APP_DIR/"
  rm -rf "$TMP_CLONE"
else
  log "Updating existing repo"
  git fetch --all
  git reset --hard "origin/$BRANCH"
  git clean -fd
fi

#############################################
# ENV SYNC (optional)
#############################################
cd "$APP_DIR"

if [[ -f "$ENV_PAYLOAD_PATH" ]]; then
  log "Applying .env updates"
  mv "$ENV_PAYLOAD_PATH" "$ENV_FILE"
else
  log "No env file provided (skipped)"
  if [[ ! -f "$ENV_FILE" ]]; then
    if [[ -f "$ENV_EXAMPLE_FILE" ]]; then
      log "Creating .env from .env.example"
      cp "$ENV_EXAMPLE_FILE" "$ENV_FILE"
    else
      log "Creating empty .env"
      touch "$ENV_FILE"
    fi
  fi
fi

#############################################
# BUILD (Vite)
#############################################
cd "$APP_DIR/$APP_SUBDIR"

log "Cleaning old build artifacts"
rm -rf dist

log "Installing dependencies"
npm install --no-audit --no-fund

log "Building Vite application"
npm run build

#############################################
# PM2: SERVE SPA FROM dist
#############################################
cd "$APP_DIR/$APP_SUBDIR"

log "Starting/restarting PM2 static server"
mkdir -p "$APP_DIR/logs"

if pm2 describe "$PM2_APP" >/dev/null 2>&1; then
  pm2 restart ecosystem.config.js --only "$PM2_APP"
else
  pm2 start ecosystem.config.js --only "$PM2_APP"
fi

pm2 save

log "Deployment completed successfully"
log "React app '$PM2_APP' serving dist/ on port $APP_PORT"
