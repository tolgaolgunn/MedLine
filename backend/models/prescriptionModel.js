// models/prescriptionModel.js - Güncellenmiş versiyon
const { pool } = require('../config/db');

class Prescription {
  static async create(client, prescriptionData) {
    const query = {
      text: `INSERT INTO prescriptions (
        appointment_id, doctor_id, patient_id, prescription_code, 
        diagnosis, general_instructions, usage_instructions, 
        next_visit_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      values: [
        prescriptionData.appointmentId,
        prescriptionData.doctorId,
        prescriptionData.patientId,
        prescriptionData.prescriptionCode,
        prescriptionData.diagnosis,
        prescriptionData.generalInstructions || null,
        prescriptionData.usageInstructions || null,
        prescriptionData.nextVisitDate || null,
        prescriptionData.status || 'active'
      ]
    };

    const result = await client.query(query);
    return result.rows[0];
  }

  static async findById(prescriptionId) {
    const query = {
      text: `SELECT * FROM prescriptions WHERE prescription_id = $1`,
      values: [prescriptionId]
    };

    const result = await pool.query(query);
    return result.rows[0];
  }

  static async findByPatientId(patientId) {
    const query = {
      text: `SELECT * FROM prescriptions WHERE patient_id = $1 ORDER BY created_at DESC`,
      values: [patientId]
    };

    const result = await pool.query(query);
    return result.rows;
  }

  static async updateStatus(prescriptionId, newStatus) {
    const query = {
      text: `UPDATE prescriptions 
             SET status = $1, updated_at = NOW() 
             WHERE prescription_id = $2 
             RETURNING *`,
      values: [newStatus, prescriptionId]
    };

    const result = await pool.query(query);
    return result.rows[0];
  }

  // Yeni eklenen method'lar
  static async findAll() {
    const query = {
      text: `SELECT * FROM prescriptions ORDER BY created_at DESC`
    };

    const result = await pool.query(query);
    return result.rows;
  }

  static async update(client, prescriptionId, updateData) {
    const query = {
      text: `UPDATE prescriptions 
             SET diagnosis = COALESCE($1, diagnosis),
                 general_instructions = COALESCE($2, general_instructions),
                 usage_instructions = COALESCE($3, usage_instructions),
                 next_visit_date = $4,
                 status = COALESCE($5, status),
                 updated_at = NOW()
             WHERE prescription_id = $6 
             RETURNING *`,
      values: [
        updateData.diagnosis,
        updateData.generalInstructions,
        updateData.usageInstructions,
        updateData.nextVisitDate || null,
        updateData.status,
        prescriptionId
      ]
    };

    const result = await client.query(query);
    return result.rows[0];
  }

  static async delete(client, prescriptionId) {
    const query = {
      text: `DELETE FROM prescriptions WHERE prescription_id = $1 RETURNING *`,
      values: [prescriptionId]
    };

    const result = await client.query(query);
    return result.rows[0];
  }

  // Doktor bazlı reçeteler
  static async findByDoctorId(doctorId) {
    const query = {
      text: `SELECT * FROM prescriptions WHERE doctor_id = $1 ORDER BY created_at DESC`,
      values: [doctorId]
    };

    const result = await pool.query(query);
    return result.rows;
  }

  // Durum bazlı reçeteler
  static async findByStatus(status) {
    const query = {
      text: `SELECT * FROM prescriptions WHERE status = $1 ORDER BY created_at DESC`,
      values: [status]
    };

    const result = await pool.query(query);
    return result.rows;
  }

  // Tarih aralığına göre reçeteler
  static async findByDateRange(startDate, endDate) {
    const query = {
      text: `SELECT * FROM prescriptions 
             WHERE created_at >= $1 AND created_at <= $2 
             ORDER BY created_at DESC`,
      values: [startDate, endDate]
    };

    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = Prescription;