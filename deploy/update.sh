#!/bin/bash
set -e

# =============================================================================
# FinTrack Update Script
# Pulls the latest code and redeploys backend + frontend
# =============================================================================

APP_DIR="/opt/fintrack"

echo "============================================="
echo "  FinTrack Update"
echo "============================================="
echo ""

# --- Pull latest code ---
echo ">>> Pulling latest code..."
cd "$APP_DIR"
git pull origin main

# --- Update backend ---
echo ""
echo ">>> Updating backend dependencies..."
cd "$APP_DIR/backend"
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate

# --- Update frontend ---
echo ""
echo ">>> Updating frontend dependencies and rebuilding..."
cd "$APP_DIR/frontend"
npm install
npm run build

# --- Restart services ---
echo ""
echo ">>> Restarting services..."
sudo systemctl restart fintrack-backend fintrack-frontend

echo ""
echo "============================================="
echo "  Update complete!"
echo "============================================="
echo ""
echo "  Backend:  $(sudo systemctl is-active fintrack-backend)"
echo "  Frontend: $(sudo systemctl is-active fintrack-frontend)"
echo ""
