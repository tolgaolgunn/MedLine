const { Pool } = require('pg');
const db = require('../config/db');

// Randevu oluşturma
exports.createAppointment = async (req, res) => {
  try {
    const { patient_id, doctor_id, datetime, type } = req.body;
    console.log("Gelen body:", req.body);

    if (!patient_id || !doctor_id || !datetime || !type) {
      return res.status(400).json({ message: 'Tüm alanlar zorunludur.' });
    }

    const result = await db.query(
      `INSERT INTO appointments (patient_id, doctor_id, datetime, type) VALUES ($1, $2, $3, $4) RETURNING *`,
      [patient_id, doctor_id, datetime, type]
    );

    console.log("Randevu oluşturuldu:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Veritabanı hatası:", err);
    res.status(500).json({ message: err.message });
  }
};


exports.getAppointmentsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const result = await db.query(
      `SELECT a.*, u.full_name AS doctor_name, d.specialty AS doctor_specialty
       FROM appointments a
       JOIN users u ON a.doctor_id = u.user_id
       JOIN doctor_profiles d ON u.user_id = d.user_id
       WHERE a.patient_id = $1
       ORDER BY a.datetime DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Doktorun belirli bir tarihteki randevularını getirir
exports.getDoctorAppointmentsByDate = async (req, res) => {
  // TODO: Implement logic to fetch doctor's appointments by date
  res.status(200).json({ message: 'getDoctorAppointmentsByDate endpoint is working.' });
};
