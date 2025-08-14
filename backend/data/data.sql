CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE patient_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    birth_date DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    address TEXT,
    medical_history TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE doctor_profiles (
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
);

CREATE TABLE IF NOT EXISTS appointments (
    appointment_id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    datetime TIMESTAMP NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('online', 'face_to_face')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reçeteler
CREATE TABLE prescriptions (
    prescription_id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    patient_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    prescription_code VARCHAR(50) UNIQUE, -- Reçete kodu (TCKN + tarih gibi)
    diagnosis TEXT, -- Teşhis bilgisi eklendi
    general_instructions TEXT, -- Genel talimatlar eklendi
    usage_instructions TEXT, -- Kullanım talimatları eklendi
    next_visit_date DATE, -- Sonraki ziyaret tarihi eklendi
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reçete içerikleri (ilaçlar)
CREATE TABLE prescription_items (
    item_id SERIAL PRIMARY KEY,
    prescription_id INTEGER REFERENCES prescriptions(prescription_id) ON DELETE CASCADE,
    medicine_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL, -- 10mg gibi
    frequency VARCHAR(100) NOT NULL, -- Günde 2 kez gibi (yeni eklendi)
    duration VARCHAR(100) NOT NULL, -- 7 gün gibi (yeni eklendi)
    usage_instructions TEXT,
    side_effects TEXT,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Update or recreate the feedbacks table
CREATE TABLE feedbacks (
    feedback_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    feedback_type VARCHAR(20) NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'submitted',
    admin_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_feedback_type CHECK (feedback_type IN ('ui_interface', 'appointment_issue', 'technical_support', 'other')),
    CONSTRAINT valid_status CHECK (status IN ('submitted', 'reviewing', 'responded', 'resolved'))
);