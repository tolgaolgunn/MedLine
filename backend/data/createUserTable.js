const pool = require('../config/db');
const bcrypt = require('bcrypt');

async function initializeDatabase() {
    try {
        const client = await pool.connect();
        console.log('Connected to PostgreSQL');

        // Şema ayarı
        await client.query('SET search_path TO public');

        // USERS TABLOSU
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                user_id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                phone_number VARCHAR(20),
                national_id VARCHAR(11) UNIQUE,
                role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
                is_approved BOOLEAN DEFAULT FALSE,
                last_login TIMESTAMP,
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
                blood_type VARCHAR(5) DEFAULT 'A+' CHECK (blood_type IN (
                    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'
                )),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // DOCTOR_PROFILES TABLOSU
        await client.query(`
            CREATE TABLE IF NOT EXISTS doctor_profiles (
                user_id INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
                specialty VARCHAR(100) NOT NULL,
                license_number VARCHAR(50) UNIQUE NOT NULL,
                experience_years INTEGER DEFAULT 0,
                biography TEXT,
                city VARCHAR(50) NOT NULL,
                district VARCHAR(50) NOT NULL,
                hospital_name VARCHAR(100),
                approved_by_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // PRESCRIPTIONS TABLOSU
        await client.query(`
            CREATE TABLE IF NOT EXISTS prescriptions (
                prescription_id SERIAL PRIMARY KEY,
                appointment_id INTEGER REFERENCES appointments(appointment_id) ON DELETE CASCADE,
                doctor_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                patient_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                prescription_code VARCHAR(50) UNIQUE,
                diagnosis TEXT,
                general_instructions TEXT,
                usage_instructions TEXT,
                next_visit_date DATE,
                status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // PRESCRIPTION_ITEMS TABLOSU
        await client.query(`
            CREATE TABLE IF NOT EXISTS prescription_items (
                item_id SERIAL PRIMARY KEY,
                prescription_id INTEGER REFERENCES prescriptions(prescription_id) ON DELETE CASCADE,
                medicine_name VARCHAR(255) NOT NULL,
                dosage VARCHAR(100) NOT NULL,
                frequency VARCHAR(100) NOT NULL,
                duration VARCHAR(100) NOT NULL,
                usage_instructions TEXT,
                side_effects TEXT,
                quantity INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // APPOINTMENTS TABLOSU
        await client.query(`
            CREATE TABLE IF NOT EXISTS appointments (
                appointment_id SERIAL PRIMARY KEY,
                patient_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                doctor_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                datetime TIMESTAMP NOT NULL,
                type VARCHAR(20) NOT NULL CHECK (type IN ('online', 'face_to_face')),
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // FEEDBACKS TABLOSU
        await client.query(`
            CREATE TABLE IF NOT EXISTS feedbacks (
                feedback_id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('ui_interface', 'appointment_issue', 'technical_support', 'other')),
                title VARCHAR(100) NOT NULL,
                message TEXT NOT NULL CHECK (LENGTH(message) <= 500),
                status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewing', 'responded', 'resolved')),
                admin_response TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // MEDICAL_RESULTS TABLOSU - Doktorun hasta sonuçlarını kaydettiği tablo
        await client.query(`
            CREATE TABLE IF NOT EXISTS medical_results (
                result_id SERIAL PRIMARY KEY,
                patient_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                doctor_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                details TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // MEDICAL_RESULT_FILES TABLOSU - Sonuçlara eklenen dosyalar
        await client.query(`
            CREATE TABLE IF NOT EXISTS medical_result_files (
                file_id SERIAL PRIMARY KEY,
                result_id INTEGER NOT NULL REFERENCES medical_results(result_id) ON DELETE CASCADE,
                file_path TEXT NOT NULL,
                original_name VARCHAR(255) NOT NULL,
                mime_type VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Admin kullanıcı ekleme
        const email = 'admin1@healthcare.com';
        const password = 'Admin1234';
        const fullName = 'Admin User';
        const phoneNumber = '05555555555';
        const role = 'admin';
        const isApproved = true;

        const hashedPassword = await bcrypt.hash(password, 10);

        const existingAdmin = await client.query(`SELECT * FROM users WHERE email = $1`, [email]);
        if (existingAdmin.rows.length === 0) {
            await client.query(`
                INSERT INTO users (email, password_hash, full_name, phone_number, role, is_approved)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [email, hashedPassword, fullName, phoneNumber, role, isApproved]);

            console.log(`Admin user created -> email: ${email}, password: ${password}`);
        } else {
            console.log('Admin user already exists.');
        }

        client.release();
        console.log('All tables ensured: users, patient_profiles, doctor_profiles, prescriptions, prescription_items, appointments, feedbacks, medical_results, medical_result_files');
    } catch (error) {
        console.error('Database initialization error:', error);
        process.exit(1);
    }
}

module.exports = initializeDatabase;
