# FinTrack - Oracle Cloud Free Tier Deployment Guide

This guide walks you through deploying FinTrack on Oracle Cloud's Always Free tier using an ARM-based VM. You get a powerful server (4 CPUs, 24 GB RAM) completely free, forever.

---

## Table of Contents

1. [Create an Oracle Cloud Free Account](#1-create-an-oracle-cloud-free-account)
2. [Create an ARM VM Instance](#2-create-an-arm-vm-instance)
3. [Configure Firewall / Security List](#3-configure-firewall--security-list)
4. [SSH into Your VM](#4-ssh-into-your-vm)
5. [Set Up a Free Domain (DuckDNS)](#5-set-up-a-free-domain-duckdns)
6. [Run the Setup Script](#6-run-the-setup-script)
7. [Enable HTTPS with Let's Encrypt](#7-enable-https-with-lets-encrypt)
8. [Access from Your Phone](#8-access-from-your-phone)
9. [Updating FinTrack](#9-updating-fintrack)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Create an Oracle Cloud Free Account

1. Go to [https://www.oracle.com/cloud/free/](https://www.oracle.com/cloud/free/)
2. Click **Start for Free**
3. Fill in your details:
   - Use a valid email address
   - Choose your **Home Region** (pick one closest to you; this cannot be changed later)
   - You will need a credit/debit card for verification, but you will NOT be charged
4. Complete email verification and sign in to the Oracle Cloud Console

> **Note:** Oracle's Always Free tier includes 4 ARM-based OCPUs and 24 GB RAM total. This is not a trial -- these resources are free forever as long as your account stays active.

---

## 2. Create an ARM VM Instance

1. In the Oracle Cloud Console, go to **Compute > Instances**
2. Click **Create Instance**
3. Configure the following:

### Name
- Give it a name like `fintrack-server`

### Placement
- Leave the default availability domain

### Image and Shape
- Click **Change Image**
  - Select **Ubuntu**
  - Choose **Canonical Ubuntu 22.04** (aarch64 / ARM)
  - Click **Select Image**
- Click **Change Shape**
  - Select **Ampere** (ARM-based processor)
  - Shape: **VM.Standard.A1.Flex**
  - Number of OCPUs: **4** (max for free tier)
  - Amount of memory: **24 GB** (max for free tier)
  - Click **Select Shape**

### Networking
- Use the default VCN or create a new one
- Make sure **Assign a public IPv4 address** is selected

### SSH Key
- Select **Generate a key pair**
- Click **Save Private Key** and **Save Public Key**
  - Save the private key file (e.g., `ssh-key-fintrack.key`) somewhere safe
  - On Mac/Linux, you will need to set permissions: `chmod 600 ssh-key-fintrack.key`

### Boot Volume
- Boot volume size: **50 GB** (free tier allows up to 200 GB total)
- Leave other options as default

4. Click **Create**
5. Wait for the instance to show **Running** status
6. Note the **Public IP Address** displayed on the instance details page

---

## 3. Configure Firewall / Security List

Oracle Cloud blocks most ports by default. You need to open ports 80 (HTTP), 443 (HTTPS), and 22 (SSH).

### Add Ingress Rules

1. From your instance details page, click on the **Subnet** link under "Primary VNIC"
2. Click on the **Security List** (usually named "Default Security List for ...")
3. Click **Add Ingress Rules**
4. Add the following rules one at a time:

**Rule 1 - HTTP (port 80):**
- Source Type: CIDR
- Source CIDR: `0.0.0.0/0`
- IP Protocol: TCP
- Destination Port Range: `80`
- Description: HTTP

**Rule 2 - HTTPS (port 443):**
- Source Type: CIDR
- Source CIDR: `0.0.0.0/0`
- IP Protocol: TCP
- Destination Port Range: `443`
- Description: HTTPS

> **Note:** Port 22 (SSH) is usually open by default. If it is not, add it the same way with destination port `22`.

---

## 4. SSH into Your VM

Open a terminal on your computer and run:

```bash
# Set correct permissions on the key file (first time only)
chmod 600 ~/Downloads/ssh-key-fintrack.key

# Connect to your VM
ssh -i ~/Downloads/ssh-key-fintrack.key ubuntu@<YOUR_PUBLIC_IP>
```

Replace `<YOUR_PUBLIC_IP>` with the public IP from step 2.

If prompted "Are you sure you want to continue connecting?", type `yes`.

You should now see a Ubuntu terminal prompt.

---

## 5. Set Up a Free Domain (DuckDNS)

You need a domain name for HTTPS to work. DuckDNS provides free subdomains.

### Create a DuckDNS Subdomain

1. Go to [https://www.duckdns.org](https://www.duckdns.org)
2. Sign in with Google, GitHub, Twitter, or Reddit
3. In the "sub domain" field, type your desired name (e.g., `myfintrack`)
   - This gives you `myfintrack.duckdns.org`
4. Click **add domain**
5. Set the IP to your Oracle Cloud VM's public IP address
6. Note your **token** from the top of the DuckDNS page

### Configure Auto-Update on Your VM

SSH into your VM and run:

```bash
# Download the DuckDNS setup script
curl -fsSL https://raw.githubusercontent.com/killua-31/exp-tracker/main/deploy/duckdns-setup.sh -o duckdns-setup.sh
chmod +x duckdns-setup.sh

# Run it with your subdomain and token
./duckdns-setup.sh myfintrack YOUR_TOKEN_HERE
```

This sets up a cron job that keeps your domain pointing to your VM's IP address.

---

## 6. Run the Setup Script

Still connected via SSH, run the following commands:

```bash
# Download the setup script
curl -fsSL https://raw.githubusercontent.com/killua-31/exp-tracker/main/deploy/setup.sh -o setup.sh
chmod +x setup.sh

# Run the setup script with your domain
APP_DOMAIN=myfintrack.duckdns.org ./setup.sh
```

Replace `myfintrack.duckdns.org` with your actual DuckDNS subdomain.

The script will:
- Install all dependencies (Python, Node.js, Nginx, etc.)
- Clone the FinTrack repository
- Set up the backend (FastAPI) and frontend (Next.js)
- Configure Nginx as a reverse proxy
- Set up systemd services so everything starts on boot

This process takes about 5-10 minutes.

---

## 7. Enable HTTPS with Let's Encrypt

After setup completes, enable free HTTPS:

```bash
sudo certbot --nginx -d myfintrack.duckdns.org
```

- Enter your email when prompted
- Agree to terms of service
- Choose whether to share your email with EFF
- Certbot will automatically configure HTTPS and set up auto-renewal

Verify auto-renewal works:

```bash
sudo certbot renew --dry-run
```

---

## 8. Access from Your Phone

Once deployment is complete:

1. Open your phone's browser (Chrome, Safari, etc.)
2. Navigate to `https://myfintrack.duckdns.org` (your domain)
3. FinTrack is a responsive web app -- it works well on mobile browsers

### Add to Home Screen (PWA-like experience)

**iPhone (Safari):**
1. Open the site in Safari
2. Tap the Share button (square with arrow)
3. Tap "Add to Home Screen"
4. Tap "Add"

**Android (Chrome):**
1. Open the site in Chrome
2. Tap the three-dot menu
3. Tap "Add to Home screen"
4. Tap "Add"

This creates an app-like icon on your phone for quick access.

---

## 9. Updating FinTrack

When there are new updates to FinTrack, SSH into your VM and run:

```bash
/opt/fintrack/deploy/update.sh
```

Or download and run the update script:

```bash
curl -fsSL https://raw.githubusercontent.com/killua-31/exp-tracker/main/deploy/update.sh -o update.sh
chmod +x update.sh
./update.sh
```

---

## 10. Troubleshooting

### Check if services are running

```bash
sudo systemctl status fintrack-backend
sudo systemctl status fintrack-frontend
sudo systemctl status nginx
```

### View logs

```bash
# Backend logs
sudo journalctl -u fintrack-backend -f

# Frontend logs
sudo journalctl -u fintrack-frontend -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Restart services

```bash
sudo systemctl restart fintrack-backend
sudo systemctl restart fintrack-frontend
sudo systemctl restart nginx
```

### Common issues

**"502 Bad Gateway" in browser:**
- The backend or frontend service may not be running yet. Check their status and logs.

**Cannot SSH into VM:**
- Make sure port 22 is open in the Oracle Cloud Security List.
- Check that your SSH key file has correct permissions (`chmod 600`).

**Cannot access site in browser:**
- Make sure ports 80 and 443 are open in the Oracle Cloud Security List.
- Check that UFW firewall is configured: `sudo ufw status`
- Verify Nginx is running: `sudo systemctl status nginx`

**DuckDNS domain not resolving:**
- Run `~/duckdns/duck.sh` manually and check `~/duckdns/duck.log` for errors.
- Make sure the IP address on duckdns.org matches your VM's public IP.

**Out of memory during npm build:**
- The 24 GB RAM should be more than enough, but if you chose a smaller shape, the Next.js build can be memory-intensive. You can add swap space:
  ```bash
  sudo fallocate -l 4G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  ```

---

## Architecture Overview

```
Internet
   |
   v
[Oracle Cloud VM - ARM, 4 CPU, 24GB RAM]
   |
   +-- Nginx (port 80/443)
   |     |
   |     +-- /api/*  -->  FastAPI backend (port 8000)
   |     +-- /*      -->  Next.js frontend (port 3000)
   |
   +-- SQLite database (file-based, no extra server needed)
   +-- Let's Encrypt (auto-renewed SSL certificates)
   +-- DuckDNS (free domain, auto-updated IP)
```

## Cost Summary

| Resource | Cost |
|----------|------|
| Oracle Cloud ARM VM (4 OCPU, 24 GB RAM) | Free (Always Free tier) |
| 50 GB boot volume | Free (Always Free tier) |
| DuckDNS subdomain | Free |
| Let's Encrypt SSL certificate | Free |
| **Total** | **$0/month** |
