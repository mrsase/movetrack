#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
#  MoveTrack — one-click run (macOS)
#
#  Double-click this file in Finder, or run:  bash run.command
#  It serves the PRODUCTION build (API + app, one port) via npm start.
#  Press Ctrl+C once to stop everything.
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")"

PORT=4000

# --- sanity checks -------------------------------------------------------
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js is not on your PATH."
  echo "   Install it from https://nodejs.org and try again."
  [ -t 0 ] && read -r -p "Press Enter to close…"
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "First run — installing dependencies…"
  npm run setup
fi

# production build, built once (or after any change)
if [ ! -f server/dist/index.js ] || [ ! -f client/dist/index.html ]; then
  echo "First run — building…"
  npm run build
fi

if lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "⚠️  Port $PORT is already in use — is MoveTrack already running?"
  echo "   Close the other window (Ctrl+C) and try again."
  [ -t 0 ] && read -r -p "Press Enter to close…"
  exit 1
fi

# --- one Ctrl+C stops everything ------------------------------------------
NPM_PID=""
# Recursively TERM a process and everything it spawned.
kill_tree() {
  local pid=$1
  for kid in $(pgrep -P "$pid" 2>/dev/null || true); do
    kill_tree "$kid"
  done
  kill -TERM "$pid" 2>/dev/null || true
}
cleanup() {
  trap - INT TERM EXIT
  echo
  echo "⏹  MoveTrack is stopping…"
  if [ -n "$NPM_PID" ]; then
    kill_tree "$NPM_PID"
    sleep 1
  fi
  exit 0
}
trap cleanup INT TERM EXIT

# --- go -------------------------------------------------------------------
LAN=$(ipconfig getifaddr en0 2>/dev/null || true)
echo "──────────────────────────────────────────────"
echo "   📦  MoveTrack — office move inventory"
echo "──────────────────────────────────────────────"
echo "   This Mac :  http://localhost:$PORT"
if [ -n "$LAN" ]; then
  echo "   Phone    :  http://$LAN:$PORT   (same Wi-Fi)"
fi
echo
echo "   Press Ctrl+C here to stop everything."
echo "──────────────────────────────────────────────"

# open the browser automatically when run from Finder / a terminal
if [ -t 0 ]; then
  (sleep 2 && open "http://localhost:$PORT") >/dev/null 2>&1 &
fi

npm start &
NPM_PID=$!
wait "$NPM_PID"