const db = require('../config/db');

const createView= async()=>{
  await db.query(`
    CREATE OR REPLACE VIEW doctor_ratings_view AS
    SELECT 
      r.rating_id,
      r.doctor_id,
      r.patient_id,
      r.rating,
      r.comment,
      r.created_at,
      u.full_name AS patient_name,
      u.email AS patient_email,
      u.phone_number AS patient_phone,
      d.full_name AS doctor_name,
      d.email AS doctor_email,
      d.phone_number AS doctor_phone
    FROM doctor_ratings r
    JOIN users u ON r.patient_id = u.user_id
    JOIN users d ON r.doctor_id = d.user_id
  `);
}

const getDoctorStats= async(doctorId)=>{
  const result = await db.query(`
    SELECT 
      COUNT(*) AS total_ratings,
      AVG(rating) AS average_rating
    FROM doctor_ratings
    WHERE doctor_id = $1
  `, [doctorId]);
  return result.rows[0];
}

const createReview = async (doctorId, patientId, rating, comment, appointmentId) => {
  const result = await db.query(
    `INSERT INTO doctor_ratings (doctor_id, patient_id, rating, comment, appointment_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [doctorId, patientId, rating, comment, appointmentId]
  );
  return result.rows[0];
};

module.exports = {
  createView,
  getDoctorStats,
  createReview
};