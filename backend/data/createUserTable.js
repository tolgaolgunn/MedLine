const pool = require('../config/db');

async function initializeDatabase() {
    try {
        const client = await pool.connect();
        console.log('Connected to PostgreSQL');

        // USERS TABLOSU
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

        // PATIENT_PROFILES TABLOSU
        await client.query(`
            CREATE TABLE IF NOT EXISTS patient_profiles (
                user_id INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
                birth_date DATE,
                gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
                address TEXT,
                medical_history TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        client.release();
        console.log('Users and patient_profiles tables ensured');
    } catch (error) {
        console.error('Database initialization error:', error);
        process.exit(1);
    }
}

module.exports = initializeDatabase;