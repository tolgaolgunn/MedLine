const db = require("../config/db");

const createPatientProfile = async (user_id, birth_date, gender, address, medical_history) => {
  const result = await db.query(
    `INSERT INTO patient_profiles (user_id, birth_date, gender, address, medical_history)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [user_id, birth_date, gender, address, medical_history]
  );
  return result.rows[0];
};

const getPatientProfileByUserId = async (user_id) => {
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
      p.created_at as profile_created_at,
      p.updated_at as profile_updated_at
    FROM users u
    LEFT JOIN patient_profiles p ON u.user_id = p.user_id
    WHERE u.user_id = $1 AND u.role = 'patient'`,
    [user_id]
  );
  return result.rows[0];
};

const updatePatientProfile = async (user_id, { birth_date, gender, address }) => {
  console.log('updatePatientProfile fonksiyonu çağrıldı:');
  console.log('birth_date (gelen):', birth_date, typeof birth_date);

  // Tarih formatını düzeltme
  let dbBirthDate = null;
  if (birth_date) {
    // Eğer string gelmişse (YYYY-MM-DD formatında)
    if (typeof birth_date === 'string') {
      dbBirthDate = birth_date;
    } 
    // Eğer Date objesi gelmişse
    else if (birth_date instanceof Date) {
      dbBirthDate = birth_date.toISOString().split('T')[0];
    }
  }

  console.log('DB için hazırlanan birth_date:', dbBirthDate);

  const result = await db.query(
    `UPDATE patient_profiles
     SET birth_date = $1::date, gender = $2, address = $3, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $4
     RETURNING *`,
    [dbBirthDate, gender, address, user_id]
  );

  return result.rows[0];
};
const getAllPatients = async (role) => {
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
      p.created_at as profile_created_at,
      p.updated_at as profile_updated_at
    FROM users u
    LEFT JOIN patient_profiles p ON u.user_id = p.user_id
    WHERE u.role = $1`,
    [role]
  );
  return result.rows;
};



module.exports = {
  getAllPatients,
  createPatientProfile,
  getPatientProfileByUserId,
  updatePatientProfile,
};
