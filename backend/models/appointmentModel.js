const db = require("../config/db");

const getAllAppointmentsWithDetails = async () => {
  const result = await db.query(
    `SELECT 
      a.appointment_id,
      a.patient_id,
      a.doctor_id,
      a.datetime as appointment_date,
      a.type as appointment_type,
      a.status,
      a.created_at,
      a.updated_at,
      p.full_name as patient_name,
      p.email as patient_email,
      d.full_name as doctor_name,
      d.email as doctor_email,
      dp.specialty as doctor_specialty,
      dp.hospital_name
    FROM appointments a
    JOIN users p ON a.patient_id = p.user_id
    JOIN users d ON a.doctor_id = d.user_id
    JOIN doctor_profiles dp ON d.user_id = dp.user_id
    ORDER BY a.datetime DESC`
  );
  return result.rows;
};

const getAppointmentById = async (appointmentId) => {
  const result = await db.query(
    `SELECT 
      a.appointment_id,
      a.patient_id,
      a.doctor_id,
      a.datetime as appointment_date,
      a.type as appointment_type,
      a.status,
      a.created_at,
      a.updated_at,
      p.full_name as patient_name,
      p.email as patient_email,
      d.full_name as doctor_name,
      d.email as doctor_email,
      dp.specialty as doctor_specialty,
      dp.hospital_name
    FROM appointments a
    JOIN users p ON a.patient_id = p.user_id
    JOIN users d ON a.doctor_id = d.user_id
    JOIN doctor_profiles dp ON d.user_id = dp.user_id
    WHERE a.appointment_id = $1`,
    [appointmentId]
  );
  return result.rows[0];
};

module.exports = {
  getAllAppointmentsWithDetails,
  getAppointmentById,
};
