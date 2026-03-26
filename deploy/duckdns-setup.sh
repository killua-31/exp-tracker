#!/bin/bash
set -e

# =============================================================================
# DuckDNS Free Domain Setup
# =============================================================================
#
# DuckDNS provides free subdomains (e.g., myfintrack.duckdns.org).
# This script configures automatic DNS updates so your domain always
# points to your server's current IP address.
#
# Prerequisites:
#   1. Go to https://www.duckdns.org and sign in with Google/GitHub/etc.
#   2. Create a subdomain (e.g., "myfintrack")
#   3. Copy your token from the DuckDNS dashboard
#   4. Run this script:
#        ./duckdns-setup.sh myfintrack your-token-here
#
# =============================================================================

# --- Validate arguments ---
SUBDOMAIN="${1:?Error: Missing subdomain. Usage: ./duckdns-setup.sh <subdomain> <token>}"
TOKEN="${2:?Error: Missing token. Usage: ./duckdns-setup.sh <subdomain> <token>}"

echo "============================================="
echo "  DuckDNS Setup"
echo "============================================="
echo "  Subdomain: ${SUBDOMAIN}.duckdns.org"
echo "============================================="
echo ""

# --- Create the update script ---
mkdir -p ~/duckdns

cat > ~/duckdns/duck.sh << EOF
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=${SUBDOMAIN}&token=${TOKEN}&ip=" | curl -k -o ~/duckdns/duck.log -K -
EOF

chmod +x ~/duckdns/duck.sh

# --- Run it once to verify it works ---
echo ">>> Running initial DNS update..."
~/duckdns/duck.sh

# Check the result
RESULT=$(cat ~/duckdns/duck.log 2>/dev/null || echo "ERROR")
if [ "$RESULT" = "OK" ]; then
    echo "  DNS update successful!"
else
    echo "  WARNING: DNS update returned '$RESULT'"
    echo "  Please check your subdomain and token are correct."
fi

# --- Add cron job for automatic updates every 5 minutes ---
# Remove any existing DuckDNS cron entries first, then add the new one
(crontab -l 2>/dev/null | grep -v "duckdns" ; echo "*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1") | crontab -

echo ""
echo "============================================="
echo "  DuckDNS configured!"
echo "============================================="
echo ""
echo "  Your domain: ${SUBDOMAIN}.duckdns.org"
echo "  DNS will auto-update every 5 minutes via cron."
echo ""
echo "  To manually update:  ~/duckdns/duck.sh"
echo "  To check status:     cat ~/duckdns/duck.log"
echo ""
