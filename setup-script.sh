# Create necessary directories
mkdir -p html ssl parse-cloud

# Create the missing traefik.yml (or remove traefik from docker-compose.yml)
touch traefik.yml
echo "api:
  dashboard: true
  insecure: true
entryPoints:
  web:
    address: ':80'" > traefik.yml

# Create environment file with secure passwords
cat > .env << 'EOF'
PARSE_SERVER_APPLICATION_ID=JfMeozLs8UZFxaZibAiZhlpDl5OZkyjVwzdxLfqw
PARSE_SERVER_MASTER_KEY=your_secure_master_key_here
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=secure_password_here
PARSE_DASHBOARD_USER_ID=admin
PARSE_DASHBOARD_USER_PASSWORD=admin_password_here
EOF
