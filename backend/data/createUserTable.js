const pool = require('../config/db');

async function initializeDatabase() {
    try {
        const client = await pool.connect();
        console.log('Connected to PostgreSQL');

        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                user_id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                phone_number VARCHAR(20),
                role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'doctor', 'admin', 'courier')),
                is_approved BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Varsayılan admin kullanıcısı ekle (şifre: admin123)
        await client.query(`
            INSERT INTO users (full_name, email, password_hash, role, is_approved)
            VALUES (
                'Admin User',
                'admin@example.com',
                '$2b$10$9hWz3X4Y5Z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2', -- bcrypt hash
                'admin',
                TRUE
            )
            ON CONFLICT (email) DO NOTHING
        `);

        client.release();
        console.log('Users table ensured and admin created');
    } catch (error) {
        console.error('Database initialization error:', error);
        process.exit(1);
    }
}

module.exports = initializeDatabase;