#!/bin/bash

# Script to set up SSL certificates for MySQL

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root"
    exit 1
fi

# Generate SSL certificates
echo "Generating SSL certificates for MySQL..."
mysql_ssl_rsa_setup --datadir=/var/lib/mysql

# Set proper permissions
echo "Setting proper permissions..."
chown -R mysql:mysql /var/lib/mysql/*.pem
chmod 600 /var/lib/mysql/*.pem

# Update MySQL configuration
echo "Updating MySQL configuration..."
cat >> /etc/mysql/mysql.conf.d/mysqld.cnf << EOL

# SSL Configuration
ssl-ca=/var/lib/mysql/ca.pem
ssl-cert=/var/lib/mysql/server-cert.pem
ssl-key=/var/lib/mysql/server-key.pem
EOL

# Restart MySQL
echo "Restarting MySQL..."
systemctl restart mysql

echo "SSL setup complete. Please verify the configuration:"
echo "1. Check SSL status: mysql -e 'SHOW VARIABLES LIKE \"%ssl%\";'"
echo "2. Test SSL connection: mysql -u pool_api_user -p --ssl-mode=REQUIRED"
echo "3. Verify certificates: ls -l /var/lib/mysql/*.pem" 