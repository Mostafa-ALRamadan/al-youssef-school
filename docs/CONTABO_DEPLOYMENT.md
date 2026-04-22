# Contabo VPS Deployment Guide

## 🚀 Complete Deployment Steps for Al-Youssef School

### Prerequisites
- Contabo VPS (Ubuntu 22.04 recommended)
- Domain name (optional)
- SSH access to VPS

---

## Phase 1: Initial VPS Setup

### 1. Connect to VPS
```bash
ssh root@your-vps-ip
```

### 2. Update System
```bash
apt update && apt upgrade -y
```

### 3. Install Required Software
```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PostgreSQL
apt install postgresql postgresql-contrib -y

# Install Nginx
apt install nginx -y

# Install PM2 (process manager)
npm install -g pm2

# Install Certbot (for SSL)
apt install certbot python3-certbot-nginx -y
```

### 4. Create Application User
```bash
# Create non-root user
adduser schooladmin
usermod -aG sudo schooladmin

# Switch to new user
su - schooladmin
```

---

## Phase 2: Database Setup

### 1. Setup PostgreSQL
```bash
# Switch to postgres user
sudo -u postgres psql
```

### 2. Run Database Setup Commands
```sql
-- Create database
CREATE DATABASE al_youssef_school;

-- Create user
CREATE USER al_youssef_user WITH PASSWORD 'your_strong_production_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE al_youssef_school TO al_youssef_user;

-- Exit psql
\q
```

### 3. Run Complete Schema
```bash
# Upload your complete-setup.sql file to VPS first
# Then run:
sudo -u postgres psql -d al_youssef_school -f complete-setup.sql
```

---

## Phase 3: Deploy Application

### 1. Clone Your Project
```bash
# Create project directory
mkdir /home/schooladmin/apps
cd /home/schooladmin/apps

# Clone your repository (replace with your repo URL)
git clone https://github.com/yourusername/al-youssef-school.git
cd al-youssef-school
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create Production Environment File
```bash
# Create .env.local
nano .env.local
```

Add these contents:
```env
DATABASE_URL=postgresql://al_youssef_user:your_strong_production_password@localhost:5432/al_youssef_school
JWT_SECRET=your-super-secure-jwt-secret-for-production-min-32-chars
UPLOAD_PATH=/var/www/uploads
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

### 4. Build Application
```bash
npm run build
```

### 5. Start with PM2
```bash
# Start application
pm2 start npm --name "school-app" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

---

## Phase 4: Nginx Configuration

### 1. Create Nginx Config
```bash
sudo nano /etc/nginx/sites-available/al-youssef-school
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Next.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files (uploads)
    location /uploads/ {
        alias /var/www/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
```

### 2. Enable Site
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/al-youssef-school /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Phase 5: SSL Certificate

### 1. Get SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 2. Auto-renew SSL
```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Add cron job for auto-renewal
sudo crontab -e
```

Add this line:
```
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## Phase 6: File Storage Setup

### 1. Create Upload Directory
```bash
sudo mkdir -p /var/www/uploads
sudo chown -R www-data:www-data /var/www/uploads
sudo chmod -R 755 /var/www/uploads
```

### 2. Test Upload Directory
```bash
# Create test file
sudo touch /var/www/uploads/test.txt
sudo ls -la /var/www/uploads/
```

---

## Phase 7: Security Hardening

### 1. Configure Firewall
```bash
# Enable UFW firewall
sudo ufw enable

# Allow SSH, HTTP, HTTPS
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Check status
sudo ufw status
```

### 2. Disable Root SSH
```bash
sudo nano /etc/ssh/sshd_config
```

Change:
```
PermitRootLogin no
PasswordAuthentication no
```

Restart SSH:
```bash
sudo systemctl restart ssh
```

---

## Phase 8: Monitoring & Backup

### 1. Setup Log Rotation
```bash
sudo nano /etc/logrotate.d/al-youssef-school
```

Add:
```
/home/schooladmin/.pm2/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    create 644 schooladmin schooladmin
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 2. Database Backup Script
```bash
# Create backup script
sudo nano /usr/local/bin/backup-database.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="al_youssef_school"

mkdir -p $BACKUP_DIR

# Create backup
sudo -u postgres pg_dump $DB_NAME > $BACKUP_DIR/al_youssef_school_$DATE.sql

# Compress old backups (older than 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -exec gzip {} \;

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/al_youssef_school_$DATE.sql"
```

Make executable:
```bash
sudo chmod +x /usr/local/bin/backup-database.sh
```

Add to cron (daily at 2 AM):
```bash
sudo crontab -e
```

Add:
```
0 2 * * * /usr/local/bin/backup-database.sh
```

---

## Phase 9: Testing

### 1. Test Application
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs school-app

# Check Nginx status
sudo systemctl status nginx

# Test database connection
pm2 restart school-app
```

### 2. Test SSL
```bash
# Check SSL certificate
sudo certbot certificates

# Test SSL renewal
sudo certbot renew --dry-run
```

---

## Phase 10: Maintenance Commands

### Useful Commands:
```bash
# Restart application
pm2 restart school-app

# View logs
pm2 logs school-app --lines 100

# Update application
cd /home/schooladmin/apps/al-youssef-school
git pull
npm install
npm run build
pm2 restart school-app

# Database operations
sudo -u postgres psql -d al_youssef_school

# Backup database
sudo /usr/local/bin/backup-database.sh

# Check system resources
free -h
df -h
top
```

---

## 🎯 Deployment Summary

1. ✅ VPS setup with Node.js, PostgreSQL, Nginx
2. ✅ Database created and schema imported
3. ✅ Application built and running with PM2
4. ✅ Nginx configured with SSL
5. ✅ File storage setup
6. ✅ Security hardened
7. ✅ Monitoring and backup configured

Your school management system is now running on Contabo VPS! 🚀

---

## Troubleshooting

### Common Issues:

**App not starting:**
```bash
pm2 logs school-app
# Check for database connection errors
```

**Database connection failed:**
```bash
sudo -u postgres psql -d al_youssef_school
# Test connection manually
```

**Nginx 502 error:**
```bash
sudo nginx -t
# Check Nginx configuration
pm2 status
# Check if app is running
```

**SSL not working:**
```bash
sudo certbot --nginx -d your-domain.com
# Re-run certbot
```
