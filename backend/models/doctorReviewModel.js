const db = require('../config/db');

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
  getDoctorStats,
  createReview
};