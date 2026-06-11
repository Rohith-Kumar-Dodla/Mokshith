# Deployment Guide

> **Production deployment checklist, environment setup, and scaling strategies**

---

## Table of Contents

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Environment Configuration](#environment-configuration)
- [Production Setup](#production-setup)
- [PM2 Process Management](#pm2-process-management)
- [Docker Deployment](#docker-deployment)
- [Scaling Strategies](#scaling-strategies)
- [Monitoring & Health Checks](#monitoring--health-checks)

---

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing (`npm test`)
- [ ] Code coverage >80% (`npm run test:coverage`)
- [ ] No linting errors (`npm run lint`)
- [ ] Security audit clean (`npm audit`)
- [ ] Environment variables documented

### Security

- [ ] All secrets moved to environment variables
- [ ] Strong passwords enforced
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Helmet middleware enabled
- [ ] HTTPS enabled
- [ ] JWT secrets are strong (32+ characters)

### Database

- [ ] MongoDB indexes created
- [ ] Database backups configured
- [ ] Connection pooling enabled
- [ ] Slow query logging enabled

### Performance

- [ ] Redis caching implemented
- [ ] API response compression enabled
- [ ] Static assets optimized
- [ ] Database queries optimized

### Monitoring

- [ ] Logging configured (Winston)
- [ ] Error tracking enabled (Sentry)
- [ ] Health check endpoint working
- [ ] Metrics tracking setup

---

## Environment Configuration

### Environment Variables

**File:** `.env.production`

```bash
# Server
NODE_ENV=production
PORT=5000
API_VERSION=v1

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/production?retryWrites=true&w=majority
MONGODB_OPTIONS=maxPoolSize=50&minPoolSize=10

# Redis
REDIS_HOST=redis-production.example.com
REDIS_PORT=6379
REDIS_PASSWORD=strong_redis_password
REDIS_DB=0

# JWT
JWT_SECRET=your_extremely_strong_jwt_secret_min_32_chars
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=your_strong_refresh_token_secret
REFRESH_TOKEN_EXPIRE=30d

# Razorpay
RAZORPAY_KEY_ID=rzp_live_key
RAZORPAY_KEY_SECRET=razorpay_secret
RAZORPAY_WEBHOOK_SECRET=webhook_secret

# Email (SendGrid/SMTP)
SENDGRID_API_KEY=sendgrid_api_key
EMAIL_FROM=noreply@yourdomain.com

# Sentry
SENTRY_DSN=https://sentry.io/project-dsn
SENTRY_ENVIRONMENT=production

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID=aws_access_key
AWS_SECRET_ACCESS_KEY=aws_secret_key
AWS_S3_BUCKET=production-bucket
AWS_REGION=ap-south-1

# Feature Flags
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_SMS_NOTIFICATIONS=true
ENABLE_PUSH_NOTIFICATIONS=true

# Logging
LOG_LEVEL=info
```

### Secure Environment Variables

```bash
# Never commit .env files to Git
echo ".env*" >> .gitignore

# Use environment variable management services
# - AWS Secrets Manager
# - Azure Key Vault
# - HashiCorp Vault
# - Doppler
```

---

## Production Setup

### Server Requirements

**Minimum Specs:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 50GB SSD
- OS: Ubuntu 20.04 LTS or later

**Recommended Specs:**
- CPU: 4 cores
- RAM: 8GB
- Storage: 100GB SSD
- OS: Ubuntu 22.04 LTS

### Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install build tools
sudo apt install -y build-essential

# Install MongoDB (if not using MongoDB Atlas)
# Follow MongoDB official installation guide

# Install Redis
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Install Nginx (reverse proxy)
sudo apt install -y nginx
sudo systemctl enable nginx
```

### Application Setup

```bash
# Clone repository
git clone https://github.com/your-org/b2b-backend.git
cd b2b-backend

# Install dependencies
npm ci --production

# Create logs directory
mkdir -p logs

# Create uploads directory
mkdir -p uploads

# Set permissions
chmod -R 755 logs uploads

# Copy environment file
cp .env.production .env

# Edit environment variables
nano .env
```

---

## PM2 Process Management

### PM2 Configuration

**File:** `ecosystem.config.js`

```javascript
module.exports = {
  apps: [
    {
      name: 'b2b-api',
      script: './server.js',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
      autorestart: true,
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads']
    },
    {
      name: 'b2b-workers',
      script: './workers/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production'
      },
      error_file: './logs/workers-error.log',
      out_file: './logs/workers-out.log',
      max_memory_restart: '512M',
      autorestart: true
    }
  ]
};
```

### PM2 Commands

```bash
# Start application
pm2 start ecosystem.config.js --env production

# View logs
pm2 logs

# Monitor processes
pm2 monit

# Restart processes
pm2 restart all

# Stop processes
pm2 stop all

# Delete processes
pm2 delete all

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup systemd
# Run the command PM2 outputs

# View process list
pm2 list

# View process details
pm2 describe b2b-api

# Zero-downtime restart
pm2 reload all
```

### PM2 Monitoring

```bash
# Enable PM2 Plus monitoring (optional)
pm2 link <secret_key> <public_key>

# View metrics
pm2 web
```

---

## Docker Deployment

### Dockerfile

**File:** `Dockerfile`

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Production stage
FROM node:18-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy dependencies from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app .

# Create necessary directories
RUN mkdir -p logs uploads && \
    chown -R nodejs:nodejs logs uploads

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node healthcheck.js || exit 1

# Start application
CMD ["node", "server.js"]
```

### Docker Compose

**File:** `docker-compose.yml`

```yaml
version: '3.8'

services:
  api:
    build: .
    image: b2b-api:latest
    container_name: b2b-api
    restart: always
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://mongo:27017/b2b
      REDIS_HOST: redis
      REDIS_PORT: 6379
    depends_on:
      - mongo
      - redis
    networks:
      - b2b-network
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  workers:
    build: .
    image: b2b-api:latest
    container_name: b2b-workers
    restart: always
    command: node workers/index.js
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://mongo:27017/b2b
      REDIS_HOST: redis
      REDIS_PORT: 6379
    depends_on:
      - mongo
      - redis
    networks:
      - b2b-network

  mongo:
    image: mongo:8
    container_name: b2b-mongo
    restart: always
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: secure_password
      MONGO_INITDB_DATABASE: b2b
    volumes:
      - mongo-data:/data/db
    networks:
      - b2b-network

  redis:
    image: redis:7-alpine
    container_name: b2b-redis
    restart: always
    ports:
      - "6379:6379"
    command: redis-server --requirepass secure_redis_password
    volumes:
      - redis-data:/data
    networks:
      - b2b-network

  nginx:
    image: nginx:alpine
    container_name: b2b-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
    networks:
      - b2b-network

networks:
  b2b-network:
    driver: bridge

volumes:
  mongo-data:
  redis-data:
```

### Docker Commands

```bash
# Build image
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View running containers
docker-compose ps

# Execute command in container
docker-compose exec api npm run migrate

# Remove everything (including volumes)
docker-compose down -v
```

---

## Scaling Strategies

### Horizontal Scaling

**Load Balancer Setup (Nginx):**

**File:** `nginx.conf`

```nginx
upstream api_backend {
    least_conn;
    server api-1:5000;
    server api-2:5000;
    server api-3:5000;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Vertical Scaling

- Increase CPU cores
- Increase RAM
- Increase disk I/O (use SSDs)
- Optimize Node.js memory limits

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" node server.js
```

### Database Scaling

**MongoDB:**
- Enable replication (replica set)
- Implement sharding for large datasets
- Use read replicas for read-heavy operations

**Redis:**
- Use Redis Cluster for high availability
- Implement Redis Sentinel for monitoring

---

## Monitoring & Health Checks

### Health Check Endpoint

**File:** `healthcheck.js`

```javascript
import http from 'http';

const options = {
  host: 'localhost',
  port: 5000,
  path: '/health',
  timeout: 2000
};

const request = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', (err) => {
  console.error('ERROR:', err);
  process.exit(1);
});

request.end();
```

### Monitoring Setup

```bash
# Setup log rotation
sudo apt install -y logrotate

# Configure logrotate
sudo nano /etc/logrotate.d/b2b-api
```

**Logrotate config:**

```
/home/user/b2b-backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 nodejs nodejs
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

**Document Version:** 1.0  
**Last Updated:** May 2026  
**Maintained By:** Engineering Team
