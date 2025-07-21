const { Pool } = require('pg');
const db = require('../config/db');

// Randevu oluşturma
exports.createAppointment = async (req, res) => {
  try {
    const { patient_id, doctor_id, datetime, type } = req.body;
    if (!patient_id || !doctor_id || !datetime || !type) {
      return res.status(400).json({ message: 'Tüm alanlar zorunludur.' });
    }
    const result = await db.query(
      `INSERT INTO appointments (patient_id, doctor_id, datetime, type) VALUES ($1, $2, $3, $4) RETURNING *`,
      [patient_id, doctor_id, datetime, type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 