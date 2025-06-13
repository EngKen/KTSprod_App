# Remote Database Setup Guide for Vercel Deployment

This guide will help you set up secure remote database access for your Node.js API deployed on Vercel.

## 1. Database User Setup

1. Log in to your WordPress database (MySQL/MariaDB)
2. Create a new user specifically for the API:
```sql
CREATE USER 'pool_api_user'@'%' IDENTIFIED BY 'strong_password_here';
GRANT SELECT, INSERT, UPDATE, DELETE ON wordpress_db.* TO 'pool_api_user'@'%';
FLUSH PRIVILEGES;
```

## 2. Database Remote Access Configuration

1. Edit MySQL configuration file (usually `/etc/mysql/mysql.conf.d/mysqld.cnf`):
```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

2. Find the `bind-address` line and change it to:
```
bind-address = 0.0.0.0
```

3. Restart MySQL:
```bash
sudo systemctl restart mysql
```

## 3. Firewall Configuration

1. Allow MySQL port (3306) only from Vercel's IP ranges:
```bash
# Get Vercel IP ranges
curl -s https://vercel.com/ips | grep -oE '[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/[0-9]{1,2}'

# Add firewall rules (example for UFW)
sudo ufw allow from 76.76.21.0/24 to any port 3306
sudo ufw allow from 76.76.22.0/24 to any port 3306
# Add all Vercel IP ranges
```

## 4. SSL Certificate Setup

1. Generate SSL certificates for MySQL:
```bash
sudo mysql_ssl_rsa_setup --datadir=/var/lib/mysql
```

2. Configure MySQL to use SSL:
```sql
ALTER USER 'pool_api_user'@'%' REQUIRE SSL;
FLUSH PRIVILEGES;
```

## 5. Vercel Environment Variables

Set these environment variables in your Vercel project settings:

```
DB_HOST=your_wordpress_server_ip
DB_USER=pool_api_user
DB_PASSWORD=strong_password_here
DB_NAME=wordpress_db
JWT_SECRET=your-secure-jwt-secret
TABLE_PREFIX=wp_
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend-domain.com
DB_SSL_REJECT_UNAUTHORIZED=true
```

## 6. Testing the Connection

1. Deploy to Vercel
2. Test the health endpoint:
```bash
curl https://your-vercel-app.vercel.app/api/health
```

3. Check the logs in Vercel dashboard for any connection issues

## Security Considerations

1. **IP Whitelisting**: Only allow connections from Vercel's IP ranges
2. **SSL**: Always use SSL for database connections
3. **Limited Permissions**: The API user should have only necessary permissions
4. **Rate Limiting**: The API includes rate limiting to prevent abuse
5. **CORS**: Configure CORS to only allow your frontend domain
6. **Environment Variables**: Keep all sensitive data in environment variables

## Troubleshooting

1. **Connection Refused**:
   - Check firewall rules
   - Verify MySQL is listening on all interfaces
   - Confirm IP whitelisting

2. **SSL Issues**:
   - Verify SSL certificates
   - Check SSL configuration in MySQL
   - Try setting DB_SSL_REJECT_UNAUTHORIZED=false temporarily for testing

3. **Authentication Failed**:
   - Verify user credentials
   - Check user permissions
   - Confirm user host restrictions

4. **Performance Issues**:
   - Monitor connection pool usage
   - Check query performance
   - Consider adding indexes to frequently queried columns 