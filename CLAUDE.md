# CLAUDE.md

This file provides comprehensive guidance to Claude Code when working with code in this repository.

## Table of Contents

1. [CRITICAL SAFETY RULES](#critical-safety-rules)
2. [Shared Terminal System](#shared-terminal-system)
3. [Quick Reference Commands](#quick-reference-commands)
4. [Project Overview](#project-overview)
5. [File Structure & Locations](#file-structure--locations)
6. [Domain Configuration](#domain-configuration)
7. [Container Configuration](#container-configuration)
8. [Port Management](#port-management)
9. [New Project Workflow](#new-project-workflow)
10. [Multi-Domain Setup](#multi-domain-setup)
11. [Email Configuration](#email-configuration)
12. [Testing & Verification](#testing--verification)
13. [Troubleshooting](#troubleshooting)
14. [Common Examples](#common-examples)
15. [Service Deployment Checklist](#service-deployment-checklist)

## ENVIRONMENT COMPATIBILITY REQUIREMENTS

**VIBECODER REQUIRES ELESTIO INFRASTRUCTURE**

### Required Components

Vibecoder will NOT start without these Elestio components:

- SMTP Infrastructure: `/opt/elestio/startPostfix.sh` must exist
- Elestio Services: Nginx, Docker, networking configuration
- File System: Proper `/opt/elestio/` directory structure
- SSL Certificates: Elestio-managed SSL certificate system

### Compatibility Check

Vibecoder includes built-in environment validation:

```javascript
function checkElestioCompatibility() {
  const startPostfixPath = "/opt/elestio/startPostfix.sh";
  try {
    require("fs").accessSync(startPostfixPath, require("fs").constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}
```

### Non-Compatible Environments

Vibecoder WILL NOT work on:

- Local development machines
- Standard Docker installations
- Generic cloud servers
- Other hosting platforms
- Environments without Elestio infrastructure

### Error Handling

If environment is incompatible:

- UI: Shows professional error page
- WebSocket: Blocks all connections
- Console: Displays clear error messages
- Status: Returns HTTP 503 Service Unavailable

## CRITICAL SAFETY RULES

**BREAKING THESE RULES WILL CAUSE SYSTEM FAILURES AND USER DISCONNECTIONS**

### RULE #1: NEVER TOUCH VIBECODER CONTAINER

```bash
# ABSOLUTELY FORBIDDEN COMMANDS:
docker-compose down                    # Stops ALL containers including vibecoder
docker-compose restart vibecoder       # Breaks active sessions
docker restart app-vibecoder-1         # Breaks active sessions
docker-compose down vibecoder          # Breaks active sessions
docker-compose up -d                   # May restart vibecoder
```

**CONSEQUENCES:**

- Disconnect ALL active terminal sessions
- Break ongoing Claude conversations
- Lose user authentication state
- Force users to restart their work
- Break WebSocket connections
- Disable image upload functionality

### RULE #2: USE SAFE OPERATIONS ONLY

```bash
# SAFE OPERATIONS (NEVER affects vibecoder):
/opt/app/safe-docker-ops.sh restart    # Safely restart all EXCEPT vibecoder
/opt/app/safe-docker-ops.sh stop       # Safely stop all EXCEPT vibecoder
/opt/app/safe-docker-ops.sh start      # Safely start all EXCEPT vibecoder
/opt/app/safe-docker-ops.sh status     # Show container status
/opt/app/safe-docker-ops.sh help       # Show help and safe commands

# SAFE individual service operations:
docker-compose restart test-landing
docker-compose stop test-landing
docker-compose up -d test-landing
```

### RULE #3: VOLUME MOUNT SECURITY

**WARNING: ALWAYS use relative paths with ./volume:/volume**

```bash
# CORRECT WAY - Always use relative paths with ./
volumes:
  - ./project:/app/data
  - ./mysql-data:/var/lib/mysql
  - ./config:/etc/nginx/conf.d

# FORBIDDEN - These will cause security issues:
volumes:
  - project:/app/data         # Missing ./
  - /project:/app/data        # Absolute path forbidden
  - volume:/app/data          # Named volume forbidden
```

### RULE #4: NGINX CONFIGURATION PRIORITY

**ALWAYS modify existing nginx .conf files before creating new ones:**

1. Check if domain-specific .conf file exists
2. If exists: MODIFY the existing file
3. If NOT exists: Only then create new file
4. NEVER create duplicate configurations

### Vibecoder Resilience System

**Built-in Recovery Mechanisms:**

- Auto-reconnect: Up to 10 attempts with exponential backoff
- Session persistence: Sessions survive nginx restarts for 10 minutes
- Heartbeat monitoring: Every 15 seconds to detect disconnections
- Page focus recovery: Automatically reconnects when tab becomes active
- Session backup: Periodic backup of active sessions every 30 seconds

**NGINX RESTART SAFE**: Vibecoder automatically reconnects after nginx restarts without losing user sessions.

## Shared Terminal System

**CRITICAL: Vibecoder uses a single shared terminal for ALL connections**

### Architecture

- **Single PTY Process**: One shared terminal instance for all users
- **Real-time Synchronization**: All users see the same terminal output
- **Persistent Sessions**: Terminal survives page refreshes and reconnections
- **Multi-device Access**: Same session accessible from multiple devices

### Implementation Details

```javascript
// Server-side: Single shared terminal
let sharedTerminal = null;
let sharedTerminalId = "shared-terminal";
const connectedClients = new Set();

function getOrCreateSharedTerminal() {
  if (sharedTerminal && !sharedTerminal.killed) {
    return sharedTerminal;
  }

  sharedTerminal = pty.spawn(claudeWrapper, [], {
    name: "xterm-256color",
    cols: 80,
    rows: 24,
    cwd: "/opt/app",
    env: { ...process.env, HOME: "/root", SHELL: "/bin/bash" },
  });

  sharedTerminal.on("data", (data) => {
    broadcastToAllClients({ type: "output", data: data });
  });

  return sharedTerminal;
}
```

### User Experience

- **Instant Sharing**: Commands typed by any user are visible to all
- **Session Persistence**: Terminal state preserved across disconnections
- **Real-time Collaboration**: Multiple users can work simultaneously
- **Automatic Recovery**: Sessions automatically restore on reconnection

### Benefits

- **True Collaboration**: Multiple users can work on the same terminal
- **No Session Loss**: Terminal persists across page refreshes
- **Resource Efficient**: Single terminal process for all users
- **Seamless Experience**: No setup required for multi-user access

## Quick Reference Commands

### Essential Operations

```bash
# Working Directory
cd /opt/app                             # Always work from here

# Container Management
docker-compose ps                       # Check container status
docker-compose logs -f service-name     # View logs for specific service

# Safe Container Operations
/opt/app/safe-docker-ops.sh restart     # Restart all (preserves vibecoder)
/opt/app/safe-docker-ops.sh status      # Check status

# Nginx Operations
docker-compose -f /opt/elestio/nginx/docker-compose.yml down && docker-compose -f /opt/elestio/nginx/docker-compose.yml up -d

# Quick Domain Testing
DOMAIN=$(grep DOMAIN /opt/app/.env | cut -d'=' -f2)
MAIN_DOMAIN=$(echo $DOMAIN | sed 's/.*,//')
curl -f https://$MAIN_DOMAIN:PORT       # Test external access
```

### Port Mapping Formula

| Component     | Formula                    | Example             |
| ------------- | -------------------------- | ------------------- |
| Internal Port | Container's service port   | 3000, 3306, 5432    |
| Binding Port  | 10000 + internal_port      | 13000, 13306, 15432 |
| External Port | 443 (SSL) OR internal port | 443, 3306, 5432     |
| If Conflict   | Add 10000 increment        | 20000+, 30000+      |

## Project Overview

**Elestio Vibe Coding Template** - Containerized development environment optimized for AI-assisted coding workflows.

### Key Architecture Points

- **Main Stack**: Runs from `/opt/app/`
- **Reverse Proxy**: Nginx configs in `/opt/elestio/nginx/`
- **Internal Network**: All containers bind to `172.17.0.1`
- **External Access**: Through nginx reverse proxy with SSL
- **Persistent Sessions**: Vibecoder container provides terminal persistence

### Working Directories

```
/opt/app/                    # ALL development work here
├── docker-compose.yml       # Main container configuration
├── .env                     # Environment variables (DOMAIN)
├── projects/               # Your projects and applications
├── config/                 # Configuration files
└── src/                    # Source code

/opt/elestio/nginx/         # Reverse proxy configuration
├── conf.d/*.conf           # HTTP proxy configurations
├── streams/*.conf          # TCP proxy configurations
└── .env                    # Nginx environment (pipe-separated domains)
```

## File Structure & Locations

### Valid Locations

```bash
/opt/app/                 # All development work
/opt/app/projects/        # Projects and folders
/opt/app/config/          # Configuration files
/opt/app/src/             # Source code
```

### Invalid Locations

```bash
/home/user/               # Wrong location
/tmp/                     # Wrong location
/root/                    # Wrong location
```

### Volume Syntax Rules

```yaml
# Correct relative paths
volumes:
  - ./project:/app/data
  - ./config:/etc/nginx/conf.d

# Wrong absolute paths
volumes:
  - /project:/app/data       # Missing ./
  - project:/app/data        # Missing ./
```

### Key Configuration Files

| File               | Purpose         | Location                    |
| ------------------ | --------------- | --------------------------- |
| docker-compose.yml | Main containers | /opt/app/docker-compose.yml |
| .env               | Domain config   | /opt/app/.env               |
| \*.conf            | HTTP proxies    | /opt/elestio/nginx/conf.d/  |
| \*.conf            | TCP proxies     | /opt/elestio/nginx/streams/ |
| .env               | Nginx domains   | /opt/elestio/nginx/.env     |

## Domain Configuration

### Environment Variable Format

**Location:** `/opt/app/.env`

```bash
# Single domain
DOMAIN=elestiodomain.com

# Multiple domains (comma-separated)
DOMAIN=elestiodomain.com,domain2.com,mydomain.com
```

### Usage Rules

- **Single domain**: Use value directly
- **Multiple domains**: Use domain after last comma for testing
- **External access**: Always use `https://domain:PORT` (SSL-enabled)

### Quick Domain Extraction

```bash
# Get all domains
DOMAINS=$(grep DOMAIN /opt/app/.env | cut -d'=' -f2 | tr ',' '\n')

# Get main domain (last one)
MAIN_DOMAIN=$(grep DOMAIN /opt/app/.env | cut -d'=' -f2 | sed 's/.*,//')

# Test main domain
curl -f https://$MAIN_DOMAIN:443
```

## Container Configuration

### CRITICAL DEVELOPMENT RULE

**PREFER VOLUME MOUNTS OVER BUILDS** for faster development:

#### Preferred Approach - Volume Mounts

```yaml
services:
  webapp:
    image: nginx:alpine
    ports:
      - "172.17.0.1:13000:3000"
    volumes:
      - ./webapp:/usr/share/nginx/html # Direct volume mount
      - ./config:/etc/nginx/conf.d # Config changes = instant
    restart: always
    environment:
      - NODE_ENV=development
```

**Benefits:**

- CSS/JS/HTML changes = instant (no rebuild)
- Configuration changes = instant
- Faster development cycle
- No container rebuild for simple changes

#### Only Use Build When

- Need to install system packages
- Require custom Dockerfile modifications
- Need compiled languages (Go, Rust, etc.)
- Complex runtime environment setup required

### Docker Compose Standards

```yaml
services:
  service-name:
    image: image:tag # Use specific tags
    ports:
      - "172.17.0.1:BINDING_PORT:INTERNAL_PORT"
    volumes:
      - ./data:/path/to/data # Use relative paths
    restart: always # REQUIRED - not 'unless-stopped'
    environment:
      - ENV_VAR=value
    # container_name: FORBIDDEN           # Let Docker auto-generate
    # networks: FORBIDDEN                 # Use default network
```

## Port Management

### CRITICAL PORT 443 RULE

**Port 443 can ONLY be modified when it belongs to the `landing-page` container:**

```bash
# WHEN YOU CAN MODIFY PORT 443:
# If nginx config shows: proxy_pass http://172.17.0.1:46455
# And docker-compose shows: landing-page container uses port 46455
# → SAFE to modify port 443 for new service

# WHEN YOU CANNOT MODIFY PORT 443:
# If port 443 points to ANY other container
# → Use alternative ports (8443, 9443, etc.)
```

### Port Decision Process

```bash
# 1. Get landing-page container port
LANDING_PORT=$(grep -A 10 "landing-page:" /opt/app/docker-compose.yml | grep "172.17.0.1:" | sed 's/.*172\.17\.0\.1:\([0-9]*\):.*/\1/')

# 2. Check what uses port 443
CURRENT_443=$(grep -r "listen 443" /opt/elestio/nginx/conf.d/*.conf | grep "proxy_pass")

# 3. Decision logic
if echo "$CURRENT_443" | grep -q "172.17.0.1:$LANDING_PORT"; then
    echo "Safe to modify port 443 (currently used by landing-page)"
else
    echo "Port 443 used by other service - choose different port"
fi
```

### HTTP Services Configuration

```yaml
# Container Configuration
services:
  myapp:
    image: nginx:alpine
    ports:
      - "172.17.0.1:13000:3000" # Internal 3000 → Binding 13000
    volumes:
      - ./myapp:/usr/share/nginx/html
    restart: always
```

```nginx
# Nginx Configuration
server {
    listen 443 ssl;                       # Default SSL port
    server_name domain.com;

    location / {
        proxy_pass http://172.17.0.1:13000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### TCP Services (Port Matching)

```yaml
# Container Configuration
services:
  mysql:
    image: mysql:8.0
    ports:
      - "172.17.0.1:13306:3306" # Internal 3306 → Binding 13306
    volumes:
      - ./mysql-data:/var/lib/mysql
    restart: always
```

```nginx
# Nginx Streams Configuration
upstream mysql {
    server 172.17.0.1:13306;
}

server {
    listen 3306;                          # External matches internal
    proxy_pass mysql;
    proxy_timeout 1s;
    proxy_responses 1;
}
```

## New Project Workflow

### Step 1: Project Setup

```bash
# Create project structure
mkdir -p /opt/app/my-project
cd /opt/app/my-project

# Create basic files
echo "<!DOCTYPE html><html><body><h1>My Project</h1></body></html>" > index.html
```

### Step 2: Container Configuration

```yaml
# Add to /opt/app/docker-compose.yml
services:
  my-project:
    image: nginx:alpine # Use appropriate base image
    ports:
      - "172.17.0.1:13001:80" # Choose available binding port
    volumes:
      - ./my-project:/usr/share/nginx/html
    restart: always
    environment:
      - NODE_ENV=production
```

### Step 3: Service Deployment

```bash
# Deploy from working directory
cd /opt/app

# Option 1: Safe restart all services
/opt/app/safe-docker-ops.sh restart

# Option 2: Start specific service only
docker-compose up -d my-project

# Restart nginx
docker-compose -f /opt/elestio/nginx/docker-compose.yml down && docker-compose -f /opt/elestio/nginx/docker-compose.yml up -d
```

### Step 4: Verification

```bash
# Test internal connectivity
curl -f http://172.17.0.1:13001
nc -zv 172.17.0.1 13001

# Test external connectivity
MAIN_DOMAIN=$(grep DOMAIN /opt/app/.env | cut -d'=' -f2 | sed 's/.*,//')
curl -f https://$MAIN_DOMAIN:443

# Check logs
docker-compose logs my-project
```

## Multi-Domain Setup

### When DOMAIN Contains Multiple Values

```bash
# Example configuration
DOMAIN=main.com,domain2.com,domain3.com
```

### Required Actions

1. **Keep main config**: `main.com.conf` (existing)
2. **Create additional configs**: `domain2.com.conf`, `domain3.com.conf`
3. **Configure SSL properly**:
   - Primary domain: Keep dedicated SSL certificates
   - Additional domains: Use `include resty-server-https.conf;`

### SSL Certificate Rules

```bash
# Get primary domain (first in ALLOWED_DOMAINS)
PRIMARY_DOMAIN=$(grep ALLOWED_DOMAINS /opt/elestio/nginx/.env | cut -d'=' -f2 | cut -d'|' -f1)

# For primary domain - KEEP existing SSL:
ssl_certificate /etc/letsencrypt/live/domain/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/domain/privkey.pem;

# For additional domains - USE generic SSL:
include resty-server-https.conf;
```

## Email Configuration

### Default SMTP Settings

**Always use these default credentials for email applications:**

```yaml
# Standard Configuration (Use these values)
SMTP_HOST: 172.17.0.1
SMTP_PORT: 25
SMTP_SECURE: false
SMTP_AUTH: false
```

### Project-Level Environment Configuration

**Each new project should have its own `.env` file for configuration:**

```bash
# Project structure
/opt/app/your-project/
├── .env                    # Project-specific environment variables
├── server.js              # Your application code
└── package.json
```

### SMTP Configuration (Only if needed)

**Only add SENDER_EMAIL if your project uses SMTP/email functionality:**

```bash
# In your project's .env file (e.g., /opt/app/your-project/.env)
SENDER_EMAIL=your-deployment@vm.elestio.app
```

**Usage in your application:**

```javascript
// Node.js - Direct environment variable access (NO grep needed!)
const senderEmail = process.env.SENDER_EMAIL;

// Use in nodemailer configuration
const mailOptions = {
  from: process.env.SENDER_EMAIL,
  to: recipientEmail,
  subject: "Your subject",
  text: "Your message",
};
```

### Implementation Examples

#### Node.js with Nodemailer

```javascript
require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransporter({
  host: "172.17.0.1",
  port: 25,
  secure: false,
  auth: false,
});

async function sendEmail() {
  const mailOptions = {
    from: process.env.SENDER_EMAIL,
    to: "recipient@example.com",
    subject: "Test Email",
    text: "Hello from the application!",
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
  } catch (error) {
    console.log("Error:", error);
  }
}
```

### Critical Email Rules

- NEVER hardcode sender email
- NEVER use grep to read environment variables
- Each project has its own `.env` file
- Add SENDER_EMAIL ONLY if project uses SMTP/email
- Use `process.env.SENDER_EMAIL` (Node.js) or `os.getenv('SENDER_EMAIL')` (Python)
- Host, port, secure, auth settings are always the same (172.17.0.1:25)
- Load .env with `require('dotenv').config()` or `load_dotenv()`

## Testing & Verification

### Quick Test Commands

```bash
# Get testing variables
DOMAIN=$(grep DOMAIN /opt/app/.env | cut -d'=' -f2)
MAIN_DOMAIN=$(echo $DOMAIN | sed 's/.*,//')

# Container status
docker-compose ps

# Internal connectivity tests
curl -f http://172.17.0.1:BINDING_PORT
nc -zv 172.17.0.1 BINDING_PORT

# External connectivity tests
curl -f https://$MAIN_DOMAIN:EXTERNAL_PORT
telnet $MAIN_DOMAIN EXTERNAL_PORT
```

## Troubleshooting

### Common Issues & Solutions

#### Container Won't Start

```bash
# Check logs for errors
docker-compose logs service-name
docker-compose logs --tail=50 service-name

# Check container status
docker-compose ps service-name

# Common fixes
docker-compose stop service-name
docker-compose rm service-name
docker-compose up -d service-name
```

#### Port Conflicts

```bash
# Find what's using a port
netstat -tlnp | grep :PORT
lsof -i :PORT

# Check all nginx configurations
grep -r "listen [0-9]" /opt/elestio/nginx/conf.d/
grep -r "listen [0-9]" /opt/elestio/nginx/streams/

# Find available ports
for port in {13000..19999}; do
    if ! netstat -ln | grep -q ":$port "; then
        echo "Available: $port"
        break
    fi
done
```

#### Nginx Issues

```bash
# Test nginx configuration
docker exec elestio-nginx nginx -t

# Check nginx logs
docker-compose -f /opt/elestio/nginx/docker-compose.yml logs -f

# Reload nginx configuration
docker exec elestio-nginx nginx -s reload

# Full nginx restart
docker-compose -f /opt/elestio/nginx/docker-compose.yml down && docker-compose -f /opt/elestio/nginx/docker-compose.yml up -d
```

#### CRITICAL: Nginx Configuration File Rules

**ALWAYS verify nginx logs after each restart:**

```bash
# After modifying any .conf file, ALWAYS:
# 1. Ensure NO EOF markers or heredoc remnants in config files
cat /opt/elestio/nginx/conf.d/domain.conf | grep -i eof

# 2. Test configuration before restart
docker exec elestio-nginx nginx -t

# 3. Restart nginx
docker-compose -f /opt/elestio/nginx/docker-compose.yml down && docker-compose -f /opt/elestio/nginx/docker-compose.yml up -d

# 4. IMMEDIATELY check logs for errors
docker-compose -f /opt/elestio/nginx/docker-compose.yml logs --tail=20
```

## Common Examples

### Redis Cache Service

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "172.17.0.1:16379:6379"
    volumes:
      - ./redis-data:/data
      - ./redis.conf:/usr/local/etc/redis/redis.conf
    restart: always
    command: redis-server /usr/local/etc/redis/redis.conf
    environment:
      - REDIS_PASSWORD=yourpassword
```

```nginx
upstream redis {
    server 172.17.0.1:16379;
}

server {
    listen 6379;
    proxy_pass redis;
    proxy_timeout 3s;
    proxy_responses 1;
}
```

### PostgreSQL Database

```yaml
services:
  postgres:
    image: postgres:15-alpine
    ports:
      - "172.17.0.1:15432:5432"
    volumes:
      - ./postgres-data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    restart: always
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=myuser
      - POSTGRES_PASSWORD=mypassword
```

```nginx
upstream postgres {
    server 172.17.0.1:15432;
}

server {
    listen 5432;
    proxy_pass postgres;
    proxy_timeout 10s;
    proxy_responses 1;
}
```

### Node.js Web Application

```yaml
services:
  nodeapp:
    image: node:18-alpine
    ports:
      - "172.17.0.1:13000:3000"
    volumes:
      - ./nodeapp:/app
      - /app/node_modules
    working_dir: /app
    restart: always
    command: npm start
    environment:
      - NODE_ENV=production
      - PORT=3000
```

```nginx
server {
    listen 443 ssl;
    server_name domain.com;

    location / {
        proxy_pass http://172.17.0.1:13000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Service Deployment Checklist

### Pre-Deployment

- [ ] Project created in `/opt/app/project-name`
- [ ] **Volume mounts preferred** over build (for faster development)
- [ ] Check available binding ports (`netstat -tlnp | grep 172.17.0.1`)
- [ ] Verify no port conflicts in nginx configs
- [ ] **Apply port 443 rule** (only if currently used by `landing-page` container)

### Container Configuration

- [ ] Added service to `/opt/app/docker-compose.yml`
- [ ] Used correct port binding format: `172.17.0.1:BINDING_PORT:INTERNAL_PORT`
- [ ] Set `restart: always` (not `unless-stopped`)
- [ ] Used relative volume paths (`./project:/path`)
- [ ] No forbidden directives (`container_name`, `networks`)
- [ ] Added necessary environment variables

### Nginx Configuration

- [ ] Only modify conf files matching domains in DOMAIN variable
- [ ] Check for port conflicts across all `.conf` files
- [ ] Used correct proxy format for HTTP services
- [ ] Used streams configuration for TCP services
- [ ] Applied multi-domain setup if needed
- [ ] Updated `ALLOWED_DOMAINS` in nginx `.env` if required
- [ ] **CRITICAL: Ensured NO EOF markers or heredoc remnants in .conf files**
- [ ] **CRITICAL: Tested nginx config with `docker exec elestio-nginx nginx -t` before restart**

### Deployment

- [ ] Used safe deployment method (**NEVER restart vibecoder**)
- [ ] Applied one of these safe options:
  - [ ] `/opt/app/safe-docker-ops.sh restart`
  - [ ] `docker-compose up -d specific-service`
- [ ] Restarted nginx: `docker-compose -f /opt/elestio/nginx/docker-compose.yml down && docker-compose -f /opt/elestio/nginx/docker-compose.yml up -d`
- [ ] **CRITICAL: Verified nginx logs immediately after restart**
- [ ] Checked for EOF markers in config files before restart

### Verification

- [ ] **Container status**: `docker-compose ps` shows running
- [ ] **Internal connectivity**: `curl -f http://172.17.0.1:BINDING_PORT`
- [ ] **External connectivity**: `curl -f https://DOMAIN:EXTERNAL_PORT`
- [ ] **Logs check**: `docker-compose logs service-name` shows no errors
- [ ] **Port conflicts**: No duplicate ports across configurations

### Development Workflow

- [ ] **Files editable on host** (volume mounted, not copied into container)
- [ ] **CSS/JS changes work instantly** without rebuild
- [ ] **Only test modified functionality** - skip validated features
- [ ] **Container logs accessible** for debugging

### Final Safety Check

- [ ] **CRITICAL**: Vibecoder container remains running and untouched
- [ ] **CRITICAL**: No use of forbidden commands (`docker-compose down`, etc.)
- [ ] All user sessions remain active and connected
- [ ] Claude Code authentication still works
- [ ] Terminal sessions still accessible

## Security Best Practices

- All external access uses HTTPS/SSL
- Port 443 default for HTTP services
- Internal binding on `172.17.0.1` only
- No direct external container access
- All traffic through nginx reverse proxy
- Environment variables for sensitive data
- Regular security updates for base images

**This documentation prioritizes safety, development speed, and user session preservation above all else.**
