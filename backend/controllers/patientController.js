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

    // Doktorun bu saatte randevusu var mı kontrol et
    const doctorConflictCheck = await db.query(
      `SELECT COUNT(*) as count FROM appointments 
       WHERE doctor_id = $1 AND datetime = $2`,
      [doctor_id, datetime]
    );

    if (parseInt(doctorConflictCheck.rows[0].count) > 0) {
      return res.status(409).json({ 
        message: 'Bu saatte doktorun başka bir randevusu bulunmaktadır.' 
      });
    }

    // Hastanın bu saatte başka randevusu var mı kontrol et
    const patientConflictCheck = await db.query(
      `SELECT COUNT(*) as count FROM appointments 
       WHERE patient_id = $1 AND datetime = $2`,
      [patient_id, datetime]
    );

    if (parseInt(patientConflictCheck.rows[0].count) > 0) {
      return res.status(409).json({ 
        message: 'Bu saatte başka bir randevunuz bulunmaktadır.' 
      });
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

exports.getDoctorAppointmentsByDate = async (req, res) => {
  try {
    const { doctor_id, date } = req.params;
    const result = await db.query(
      `SELECT a.*, u.full_name AS patient_name
       FROM appointments a
       JOIN users u ON a.patient_id = u.user_id
       WHERE a.doctor_id = $1 AND DATE(a.datetime) = $2
       ORDER BY a.datetime ASC`,
      [doctor_id, date]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Veritabanı hatası:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getPatientAppointmentsByDate = async (req, res) => {
  try {
    const { patient_id, date } = req.params;
    const result = await db.query(
      `SELECT a.*, u.full_name AS doctor_name, d.specialty AS doctor_specialty
       FROM appointments a
       JOIN users u ON a.doctor_id = u.user_id
       JOIN doctor_profiles d ON u.user_id = d.user_id
       WHERE a.patient_id = $1 AND DATE(a.datetime) = $2
       ORDER BY a.datetime ASC`,
      [patient_id, date]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Veritabanı hatası:", err);
    res.status(500).json({ message: err.message });
  }
}; 

