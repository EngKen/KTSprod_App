// Simple Express.js server to simulate the WordPress API
const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet()); // Adds various HTTP headers for security
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', limiter);

// WordPress Database Configuration with SSL
const wpConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // WordPress specific settings
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
    // SSL configuration for remote connection
    ssl: {
        // If using self-signed certificate, you might need to set rejectUnauthorized to false
        // But it's better to use proper SSL certificates
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
    }
};

// Database connection with retry logic
let pool;
async function initializePool() {
    try {
        pool = mysql.createPool(wpConfig);
        // Test the connection
        const connection = await pool.getConnection();
        connection.release();
        console.log('Database connection established successfully');
    } catch (error) {
        console.error('Database connection failed:', error);
        // Retry after 5 seconds
        setTimeout(initializePool, 5000);
    }
}

initializePool();

// WordPress table prefix
const TABLE_PREFIX = process.env.TABLE_PREFIX || 'wp_';

// Helper function to get table name with prefix
const getTableName = (name) => `${TABLE_PREFIX}${name}`;

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication middleware
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const user = jwt.verify(token, JWT_SECRET);
        req.user = user;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid token' });
    }
};

// Mock database - replace with real database in production
const mockUsers = {
    'ACC001': {
        password: 'password123',
        device_id: 1,
        owner_name: 'John Doe',
        account_no: 'ACC001',
        owner_number: '+254701234567',
        device_serial_number: 'PT001'
    },
    'ACC002': {
        password: 'test123',
        device_id: 2,
        owner_name: 'Jane Smith',
        account_no: 'ACC002',
        owner_number: '+254701234568',
        device_serial_number: 'PT002'
    }
};

const mockDevices = {
    'ACC001': [
        {
            id: 1,
            name: 'John Doe',
            serialNumber: 'PT001',
            location: 'Nairobi CBD',
            balance: 15500.75,
            dailyEarnings: 2300.50,
            dailyGamesPlayed: 45,
            gamesPlayed: 1250,
            accountNumber: 'ACC001',
            registrationDate: '2024-01-15',
            lastActivity: '2025-06-12T10:30:00',
            status: 'active'
        },
        {
            id: 2,
            name: 'John Doe',
            serialNumber: 'PT002',
            location: 'Westlands',
            balance: 8750.25,
            dailyEarnings: 1200.00,
            dailyGamesPlayed: 28,
            gamesPlayed: 890,
            accountNumber: 'ACC001',
            registrationDate: '2024-02-20',
            lastActivity: '2025-06-12T09:45:00',
            status: 'active'
        }
    ],
    'ACC002': [
        {
            id: 3,
            name: 'Jane Smith',
            serialNumber: 'PT003',
            location: 'Kiambu',
            balance: 12300.00,
            dailyEarnings: 1800.75,
            dailyGamesPlayed: 35,
            gamesPlayed: 980,
            accountNumber: 'ACC002',
            registrationDate: '2024-03-10',
            lastActivity: '2025-06-12T11:15:00',
            status: 'active'
        }
    ]
};

const mockTransactions = {
    'ACC001': [
        {
            id: 1,
            account_no: 'ACC001',
            device_id: 1,
            transaction_id: 'TXN202506120001',
            amount: 50.00,
            running_balance: 15500.75,
            payer_name: 'Michael Kamau',
            phone_number: '+254712345678',
            game_status: 'played',
            transaction_date: '2025-06-12T10:30:00'
        },
        {
            id: 2,
            account_no: 'ACC001',
            device_id: 1,
            transaction_id: 'TXN202506120002',
            amount: 100.00,
            running_balance: 15450.75,
            payer_name: 'Grace Wanjiku',
            phone_number: '+254723456789',
            game_status: 'played',
            transaction_date: '2025-06-12T09:15:00'
        },
        {
            id: 3,
            account_no: 'ACC001',
            device_id: 2,
            transaction_id: 'TXN202506120003',
            amount: 75.00,
            running_balance: 8750.25,
            payer_name: 'David Muthomi',
            phone_number: '+254734567890',
            game_status: 'not_played',
            transaction_date: '2025-06-12T08:45:00'
        }
    ],
    'ACC002': [
        {
            id: 4,
            account_no: 'ACC002',
            device_id: 3,
            transaction_id: 'TXN202506120004',
            amount: 150.00,
            running_balance: 12300.00,
            payer_name: 'Sarah Njeri',
            phone_number: '+254745678901',
            game_status: 'played',
            transaction_date: '2025-06-12T11:15:00'
        }
    ]
};

const mockWithdrawals = {
    'ACC001': [
        {
            id: 1,
            account_no: 'ACC001',
            transaction_code: 'WD202506110001',
            amount: 5000.00,
            withdrawal_account: '+254701234567',
            account_name: 'John Doe',
            payment_method: 'M-Pesa',
            status: 'completed',
            withdrawal_date: '2025-06-11T14:30:00',
            processed_date: '2025-06-11T14:35:00'
        }
    ],
    'ACC002': []
};

// API Routes

// Health check
app.get('/api/health', async (req, res) => {
    try {
        const dbStatus = pool ? 'connected' : 'disconnected';
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: dbStatus,
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Health check failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const [users] = await pool.query(
            `SELECT * FROM ${getTableName('users')} WHERE user_login = ?`,
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];
        // WordPress uses a different password hashing method
        // We'll need to use the WordPress password hash verification
        const validPassword = await verifyWordPressPassword(password, user.user_pass);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { 
                id: user.ID,
                username: user.user_login,
                email: user.user_email
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({ 
            token, 
            user: { 
                id: user.ID, 
                username: user.user_login, 
                email: user.user_email 
            } 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// WordPress password verification function
async function verifyWordPressPassword(password, hash) {
    // WordPress uses PHP's password_hash with PASSWORD_DEFAULT
    // We'll use a simple comparison for now, but you should implement proper WordPress password verification
    return password === hash; // This is temporary - implement proper WordPress password verification
}

// Get user data
app.get('/api/users/:id', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT ID, user_login, user_email, display_name FROM wp_users WHERE ID = ?',
            [req.params.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user devices
app.get('/api/devices', authenticateToken, async (req, res) => {
    try {
        const [devices] = await pool.query(
            `SELECT d.*, 
            (SELECT SUM(amount) FROM ${getTableName('device_transactions')} 
             WHERE device_id = d.device_id) as balance
            FROM ${getTableName('devices')} d 
            WHERE account_no = ?`,
            [req.user.id]
        );

        res.json(devices);
    } catch (error) {
        console.error('Get devices error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get device balance
app.get('/api/devices/:id/balance', authenticateToken, async (req, res) => {
    try {
        const [result] = await pool.query(
            `SELECT SUM(amount) as balance 
            FROM wp_device_transactions 
            WHERE device_id = ?`,
            [req.params.id]
        );

        res.json({ balance: result[0].balance || 0 });
    } catch (error) {
        console.error('Get balance error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all transactions
app.get('/api/transactions', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 20, start_date, end_date } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT t.*, d.device_name 
            FROM wp_device_transactions t
            LEFT JOIN wp_devices d ON t.device_id = d.device_id
            WHERE t.account_no = ?
        `;
        const params = [req.user.id];

        if (start_date && end_date) {
            query += ' AND t.transaction_date BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        query += ' ORDER BY t.transaction_date DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [transactions] = await pool.query(query, params);
        const [total] = await pool.query(
            'SELECT COUNT(*) as count FROM wp_device_transactions WHERE account_no = ?',
            [req.user.id]
        );

        res.json({
            transactions,
            pagination: {
                total: total[0].count,
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Process withdrawal
app.post('/api/withdrawals', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { amount, withdrawal_account, account_name, payment_method = 'M-Pesa' } = req.body;
        
        // Generate transaction code
        const transaction_code = 'W' + Date.now().toString().slice(-8);
        
        // Insert withdrawal request
        const [result] = await connection.query(
            `INSERT INTO wp_device_withdrawals 
            (account_no, transaction_code, amount, withdrawal_account, account_name, payment_method)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [req.user.id, transaction_code, amount, withdrawal_account, account_name, payment_method]
        );

        await connection.commit();
        
        res.json({
            message: 'Withdrawal request submitted successfully',
            transaction_code,
            withdrawal_id: result.insertId
        });
    } catch (error) {
        await connection.rollback();
        console.error('Withdrawal error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
});

// Get withdrawal history
app.get('/api/withdrawals', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT * FROM wp_device_withdrawals 
            WHERE account_no = ?
        `;
        const params = [req.user.id];

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY withdrawal_date DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [withdrawals] = await pool.query(query, params);
        const [total] = await pool.query(
            'SELECT COUNT(*) as count FROM wp_device_withdrawals WHERE account_no = ?',
            [req.user.id]
        );

        res.json({
            withdrawals,
            pagination: {
                total: total[0].count,
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get withdrawals error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Submit support ticket
app.post('/api/support', authenticateToken, async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            category,
            subject,
            message,
            priority = 'medium'
        } = req.body;

        const ticket_number = 'TKT' + Date.now().toString().slice(-8);

        const [result] = await pool.query(
            `INSERT INTO wp_support_tickets 
            (ticket_number, account_no, name, email, phone, category, subject, message, priority)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [ticket_number, req.user.id, name, email, phone, category, subject, message, priority]
        );

        res.json({
            message: 'Support ticket submitted successfully',
            ticket_number,
            ticket_id: result.insertId
        });
    } catch (error) {
        console.error('Support ticket error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get support tickets
app.get('/api/support', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT * FROM wp_support_tickets 
            WHERE account_no = ?
        `;
        const params = [req.user.id];

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY created_date DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [tickets] = await pool.query(query, params);
        const [total] = await pool.query(
            'SELECT COUNT(*) as count FROM wp_support_tickets WHERE account_no = ?',
            [req.user.id]
        );

        res.json({
            tickets,
            pagination: {
                total: total[0].count,
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get tickets error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get dashboard stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        const [stats] = await pool.query(
            `SELECT 
                COUNT(DISTINCT device_id) as total_devices,
                SUM(CASE WHEN game_status = 'played' THEN amount ELSE 0 END) as total_earnings,
                COUNT(CASE WHEN game_status = 'played' THEN 1 END) as total_games,
                (SELECT COUNT(*) FROM wp_device_withdrawals WHERE account_no = ? AND status = 'pending') as pending_withdrawals
            FROM wp_device_transactions
            WHERE account_no = ?`,
            [req.user.id, req.user.id]
        );

        res.json(stats[0]);
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve static files (HTML, CSS, JS)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});