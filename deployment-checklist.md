# Deployment Checklist

## 1. Database Setup
- [ ] Run `setup-db-user.sql` to create API user
- [ ] Change the default password in the SQL script
- [ ] Verify user permissions with `SHOW GRANTS FOR 'pool_api_user'@'%'`
- [ ] Run `setup-mysql-ssl.sh` to set up SSL certificates
- [ ] Verify SSL setup with `mysql -e 'SHOW VARIABLES LIKE "%ssl%";'`
- [ ] Test SSL connection with `mysql -u pool_api_user -p --ssl-mode=REQUIRED`

## 2. Server Configuration
- [ ] Update MySQL bind-address in `/etc/mysql/mysql.conf.d/mysqld.cnf`
- [ ] Configure firewall to allow MySQL port (3306) from Vercel IPs
- [ ] Verify MySQL is listening on all interfaces: `netstat -tlnp | grep mysql`
- [ ] Test remote connection from a different machine

## 3. Vercel Setup
- [ ] Create new project in Vercel dashboard
- [ ] Connect GitHub repository
- [ ] Set environment variables:
  - [ ] `DB_HOST`
  - [ ] `DB_USER`
  - [ ] `DB_PASSWORD`
  - [ ] `DB_NAME`
  - [ ] `JWT_SECRET`
  - [ ] `TABLE_PREFIX`
  - [ ] `NODE_ENV`
  - [ ] `ALLOWED_ORIGINS`
  - [ ] `DB_SSL_REJECT_UNAUTHORIZED`

## 4. Security Verification
- [ ] Verify SSL certificates are properly set up
- [ ] Confirm database user has minimal required permissions
- [ ] Check firewall rules are properly configured
- [ ] Verify CORS settings match your frontend domain
- [ ] Test rate limiting by making multiple requests
- [ ] Verify JWT token expiration

## 5. Testing
- [ ] Run `test-api.js` locally
- [ ] Deploy to Vercel
- [ ] Run `test-api.js` against Vercel deployment
- [ ] Test all API endpoints:
  - [ ] Health check
  - [ ] Login
  - [ ] User data
  - [ ] Devices
  - [ ] Transactions
  - [ ] Withdrawals
  - [ ] Support tickets

## 6. Frontend Updates
- [ ] Update API base URL in frontend code
- [ ] Update authentication to use JWT tokens
- [ ] Test all frontend features with new API
- [ ] Verify error handling
- [ ] Test loading states

## 7. Monitoring
- [ ] Set up Vercel monitoring
- [ ] Configure error logging
- [ ] Set up database monitoring
- [ ] Test error scenarios
- [ ] Verify logs are accessible

## 8. Backup
- [ ] Backup database
- [ ] Document all configuration
- [ ] Save SSL certificates securely
- [ ] Document deployment process
- [ ] Create rollback plan

## 9. Final Verification
- [ ] Run full test suite
- [ ] Check all security measures
- [ ] Verify performance
- [ ] Test under load
- [ ] Document any issues found

## 10. Post-Deployment
- [ ] Monitor error rates
- [ ] Check database connections
- [ ] Verify SSL certificates
- [ ] Monitor API response times
- [ ] Check resource usage 