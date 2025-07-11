const pool = require('../config/db');

async function initializeDatabase() {
    try {
        const client = await pool.connect();
        console.log('Connected to PostgreSQL');

        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                surname VARCHAR(255) NOT NULL DEFAULT '',
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        await client.query(`
            INSERT INTO users (name, surname, email, password)
            VALUES ('Admin', 'User', 'admin@example.com', 
            '$2b$10$9hWz3X4Y5Z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2')
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
