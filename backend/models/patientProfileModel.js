const db = require("../config/db");

const createPatientProfile = (user_id, birth_date, gender, address, medical_history = null, blood_type = null) => {
  return db.query(
    `INSERT INTO patient_profiles (user_id, birth_date, gender, address, medical_history, blood_type)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [user_id, birth_date, gender, address, medical_history, blood_type]
  ).then(result => result.rows[0]);
};

const getPatientProfileByUserId = (user_id) => {
  console.log('Fetching patient profile for user_id:', user_id); // Debug log
  return db.query(
    `SELECT 
      u.user_id,
      u.full_name,
      u.email,
      u.phone_number,
      u.national_id,
      u.is_approved,
      u.created_at as user_created_at,
      u.updated_at as user_updated_at,
      to_char(p.birth_date, 'YYYY-MM-DD') as birth_date,
      p.gender,
      p.address,
      p.medical_history,
      p.blood_type,
      p.created_at as profile_created_at,
      p.updated_at as profile_updated_at,
      u.national_id as tc_kimlik_no  -- TC Kimlik No'yu ayrıca ekleyelim
    FROM users u
    LEFT JOIN patient_profiles p ON u.user_id = p.user_id
    WHERE u.user_id = $1 AND u.role = 'patient'
    `,
    [user_id]
  ).then(result => result.rows[0]);
};

const updatePatientProfile = async (user_id, { birth_date, gender, address, blood_type, medical_history }) => {
  try {
    // Önce hasta profilinin var olup olmadığını kontrol et
    const checkProfile = await db.query(
      "SELECT * FROM patient_profiles WHERE user_id = $1",
      [user_id]
    );

    // Tarih formatını düzeltme
    let dbBirthDate = birth_date ? new Date(birth_date).toISOString().split('T')[0] : null;

    console.log('DB için hazırlanan birth_date:', dbBirthDate);

    if (checkProfile.rows.length === 0) {
      // Profil yoksa yeni profil oluştur
      const result = await db.query(
        `INSERT INTO patient_profiles (user_id, birth_date, gender, address, blood_type, medical_history)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [user_id, dbBirthDate, gender, address, blood_type, medical_history]
      );
      return result.rows[0];
    } else {
      // Profil varsa güncelle
      const result = await db.query(
        `UPDATE patient_profiles 
         SET birth_date = COALESCE($2, birth_date),
             gender = COALESCE($3, gender),
             address = COALESCE($4, address),
             blood_type = COALESCE($5, blood_type),
             medical_history = COALESCE($6, medical_history),
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 RETURNING *`,
        [user_id, dbBirthDate, gender, address, blood_type, medical_history]
      );
      return result.rows[0];
    }
  } catch (error) {
    console.error('Error in updatePatientProfile:', error);
    throw error;
  }
};

const getAllPatients = async (role) => {
  try {
    const result = await db.query(
      `SELECT 
        u.user_id,
        u.full_name,
        u.email,
        u.phone_number,
        u.is_approved,
        u.created_at as user_created_at,
        u.updated_at as user_updated_at,
        to_char(p.birth_date, 'YYYY-MM-DD') as birth_date,
        p.gender,
        p.address,
        p.medical_history,
        p.blood_type,
        p.created_at as profile_created_at,
        p.updated_at as profile_updated_at
      FROM users u
      LEFT JOIN patient_profiles p ON u.user_id = p.user_id
      WHERE u.role = $1`,
      [role]
    );
    return result.rows;
  } catch (error) {
    console.error('Error in getAllPatients:', error);
    throw error;
  }
};

const deletePatient = async (user_id) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Önce hasta profilini sil
    await client.query(
      "DELETE FROM patient_profiles WHERE user_id = $1",
      [user_id]
    );

    // Sonra user tablosundan kullanıcıyı sil
    const result = await client.query(
      "DELETE FROM users WHERE user_id = $1 AND role = 'patient' RETURNING *",
      [user_id]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getAllPatients,
  createPatientProfile,
  getPatientProfileByUserId,
  updatePatientProfile,
  deletePatient
};