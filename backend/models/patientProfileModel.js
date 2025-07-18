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
    `SELECT * FROM patient_profiles WHERE user_id = $1`,
    [user_id]
  );
  return result.rows[0];
};

const updatePatientProfile = async (user_id, { birth_date, gender, address }) => {
  const result = await db.query(
    `UPDATE patient_profiles
     SET birth_date = $1, gender = $2, address = $3, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $4
     RETURNING *`,
    [birth_date, gender, address, user_id]
  );
  return result.rows[0];
};

module.exports = {
  createPatientProfile,
  getPatientProfileByUserId,
  updatePatientProfile,
};
