#!/bin/bash
set -e

# =============================================================================
# FinTrack Server Setup Script
# Designed for a fresh Ubuntu 22.04 ARM VM (Oracle Cloud Free Tier)
# =============================================================================

# --- Configuration ---
# Override these by setting environment variables before running the script
APP_DOMAIN="${APP_DOMAIN:-your-domain.duckdns.org}"
APP_DIR="/opt/fintrack"
REPO_URL="https://github.com/killua-31/exp-tracker.git"

echo "============================================="
echo "  FinTrack Server Setup"
echo "============================================="
echo "Domain:    $APP_DOMAIN"
echo "Install:   $APP_DIR"
echo "Repo:      $REPO_URL"
echo "============================================="
echo ""

# --- Helper functions ---
log() {
    echo ""
    echo ">>> $1"
    echo ""
}

# =============================================================================
# 1. System Updates
# =============================================================================
log "Step 1/9: Updating system packages..."

sudo apt update && sudo apt upgrade -y

# =============================================================================
# 2. Install Dependencies
# =============================================================================
log "Step 2/9: Installing dependencies..."

# Install base packages
sudo apt install -y \
    python3 python3-pip python3-venv \
    nginx certbot python3-certbot-nginx \
    git ufw gettext-base curl

# Install Node.js 20 LTS (Ubuntu's default is usually too old)
if ! command -v node &> /dev/null || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]]; then
    log "Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    log "Node.js $(node -v) already installed, skipping..."
fi

echo "Python version: $(python3 --version)"
echo "Node version:   $(node -v)"
echo "npm version:    $(npm -v)"

# =============================================================================
# 3. Firewall Setup
# =============================================================================
log "Step 3/9: Configuring firewall (UFW)..."

sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw --force enable

echo "Firewall status:"
sudo ufw status

# =============================================================================
# 4. Clone Repository
# =============================================================================
log "Step 4/9: Cloning FinTrack repository..."

if [ -d "$APP_DIR/.git" ]; then
    echo "Repository already exists at $APP_DIR, pulling latest..."
    cd "$APP_DIR"
    git pull origin main
else
    sudo mkdir -p "$APP_DIR"
    sudo chown "$USER:$USER" "$APP_DIR"
    git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

# =============================================================================
# 5. Backend Setup (FastAPI + Python)
# =============================================================================
log "Step 5/9: Setting up backend..."

cd "$APP_DIR/backend"

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create backend .env file
# Using a here-doc with variable expansion for APP_DOMAIN
cat > .env << ENVEOF
DATABASE_URL=sqlite+aiosqlite:///./fintrack.db
CORS_ORIGINS=https://${APP_DOMAIN},http://${APP_DOMAIN}
DEFAULT_CURRENCY=CAD
ENVEOF

echo "Backend .env created:"
cat .env

# Seed the database
python -m app.seed || echo "Warning: Database seeding failed or seed module not found. Skipping."

deactivate

# =============================================================================
# 6. Frontend Setup (Next.js)
# =============================================================================
log "Step 6/9: Setting up frontend..."

cd "$APP_DIR/frontend"

# Install Node.js dependencies
npm install

# Create frontend .env.local with the actual domain value
cat > .env.local << ENVEOF
NEXT_PUBLIC_API_URL=https://${APP_DOMAIN}/api/v1
ENVEOF

echo "Frontend .env.local created:"
cat .env.local

# Build the production frontend
npm run build

# =============================================================================
# 7. Create Systemd Services
# =============================================================================
log "Step 7/9: Creating systemd services..."

# --- Backend service ---
sudo tee /etc/systemd/system/fintrack-backend.service > /dev/null << EOF
[Unit]
Description=FinTrack Backend (FastAPI)
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR/backend
Environment=PATH=$APP_DIR/backend/venv/bin:/usr/bin
ExecStart=$APP_DIR/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# --- Frontend service ---
sudo tee /etc/systemd/system/fintrack-frontend.service > /dev/null << EOF
[Unit]
Description=FinTrack Frontend (Next.js)
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR/frontend
ExecStart=/usr/bin/npm start -- -p 3000
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Enable and start both services
sudo systemctl daemon-reload
sudo systemctl enable fintrack-backend fintrack-frontend
sudo systemctl start fintrack-backend fintrack-frontend

echo "Services started."
echo "  Backend:  $(sudo systemctl is-active fintrack-backend)"
echo "  Frontend: $(sudo systemctl is-active fintrack-frontend)"

# =============================================================================
# 8. Nginx Reverse Proxy
# =============================================================================
log "Step 8/9: Configuring Nginx reverse proxy..."

# Write the nginx config template with placeholder
sudo tee /etc/nginx/sites-available/fintrack.template > /dev/null << 'NGINXEOF'
server {
    listen 80;
    server_name FINTRACK_DOMAIN_PLACEHOLDER;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Max upload size (for importing data, etc.)
    client_max_body_size 10M;

    # API requests -> FastAPI backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Everything else -> Next.js frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINXEOF

# Replace the placeholder with the actual domain using sed
# (avoids conflicts with nginx's own $ variables when using envsubst)
sudo sed "s/FINTRACK_DOMAIN_PLACEHOLDER/${APP_DOMAIN}/g" \
    /etc/nginx/sites-available/fintrack.template | \
    sudo tee /etc/nginx/sites-available/fintrack > /dev/null

# Remove the template file
sudo rm -f /etc/nginx/sites-available/fintrack.template

# Enable the site
sudo ln -sf /etc/nginx/sites-available/fintrack /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart nginx
sudo nginx -t
sudo systemctl restart nginx

echo "Nginx configured and running."

# =============================================================================
# 9. Done!
# =============================================================================
log "Step 9/9: Setup complete!"

echo "============================================="
echo "  FinTrack is now running!"
echo "============================================="
echo ""
echo "  URL:  http://${APP_DOMAIN}"
echo ""
echo "  To enable HTTPS (recommended), run:"
echo "    sudo certbot --nginx -d ${APP_DOMAIN}"
echo ""
echo "  Service commands:"
echo "    sudo systemctl status fintrack-backend"
echo "    sudo systemctl status fintrack-frontend"
echo "    sudo systemctl status nginx"
echo ""
echo "  View logs:"
echo "    sudo journalctl -u fintrack-backend -f"
echo "    sudo journalctl -u fintrack-frontend -f"
echo ""
echo "============================================="
