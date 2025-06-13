#!/bin/bash

# Deployment script for Node.js API on WordPress server

# Create .env file
cat > .env << EOL
DB_HOST=localhost
DB_USER=wordpress_user
DB_PASSWORD=your_wordpress_db_password
DB_NAME=wordpress_db
JWT_SECRET=your-secret-key-here
TABLE_PREFIX=wp_
PORT=3000
EOL

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Start the API with PM2
echo "Starting API server..."
pm2 start api-server.js --name "pool-table-api"

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup

echo "Deployment complete! API server is running on port 3000"
echo "To check status: pm2 status"
echo "To view logs: pm2 logs pool-table-api"
echo "To restart: pm2 restart pool-table-api" 