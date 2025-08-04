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
       user_id,
       to_char(birth_date, 'YYYY-MM-DD') as birth_date,
       gender,
       address,
       medical_history,
       created_at,
       updated_at
     FROM patient_profiles WHERE user_id = $1`,
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
module.exports = {
  createPatientProfile,
  getPatientProfileByUserId,
  updatePatientProfile,
};
