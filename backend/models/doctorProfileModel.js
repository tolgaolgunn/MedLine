const db = require("../config/db");

const createDoctorProfile = async (user_id, specialty, license_number, experience_years, biography, city, district, hospital_name, approved_by_admin = true) => {
  const result = await db.query(
    `INSERT INTO doctor_profiles (user_id, specialty, license_number, experience_years, biography, city, district, hospital_name, approved_by_admin)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [user_id, specialty, license_number, experience_years, biography, city, district, hospital_name, approved_by_admin]
  );
  return result.rows[0];
};

const getDoctorProfileByUserId = async (user_id) => {
  const result = await db.query(
    `SELECT * FROM doctor_profiles WHERE user_id = $1`,
    [user_id]
  );
  return result.rows[0];
};

const updateDoctorProfile = async (user_id, { specialty, license_number, experience_years, biography, city, district, hospital_name, approved_by_admin }) => {
  const result = await db.query(
    `UPDATE doctor_profiles
     SET specialty = $1, license_number = $2, experience_years = $3, biography = $4, city = $5, district = $6, hospital_name = $7, approved_by_admin = $8, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $9
     RETURNING *`,
    [specialty, license_number, experience_years, biography, city, district, hospital_name, approved_by_admin, user_id]
  );
  return result.rows[0];
};

const getAllDoctorsWithUser = async () => {
  const result = await db.query(`
    SELECT u.user_id, u.full_name, u.email, u.phone_number, d.specialty, d.license_number, d.experience_years, d.biography, d.city, d.district, d.hospital_name
    FROM users u
    JOIN doctor_profiles d ON u.user_id = d.user_id
    WHERE u.role = 'doctor' AND u.is_approved = TRUE AND d.approved_by_admin = TRUE
  `);
  return result.rows;
};

module.exports = {
  createDoctorProfile,
  getDoctorProfileByUserId,
  updateDoctorProfile,
  getAllDoctorsWithUser,
}; 