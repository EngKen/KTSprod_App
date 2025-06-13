-- Create dedicated user for the API
CREATE USER IF NOT EXISTS 'pool_api_user'@'%' IDENTIFIED BY 'CHANGE_THIS_TO_STRONG_PASSWORD';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON wordpress_db.wp_device_transactions TO 'pool_api_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON wordpress_db.wp_device_withdrawals TO 'pool_api_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON wordpress_db.wp_support_tickets TO 'pool_api_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON wordpress_db.wp_withdrawal_details TO 'pool_api_user'@'%';
GRANT SELECT ON wordpress_db.wp_users TO 'pool_api_user'@'%';
GRANT SELECT ON wordpress_db.wp_devices TO 'pool_api_user'@'%';

-- Require SSL for the user
ALTER USER 'pool_api_user'@'%' REQUIRE SSL;

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- Verify the grants
SHOW GRANTS FOR 'pool_api_user'@'%'; 