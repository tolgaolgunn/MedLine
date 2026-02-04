// models/reportModel.js - Doktor Raporları Model
const { pool } = require('../config/db');

class Report {
  // Yeni rapor oluştur
  static async create(client, reportData) {
    const query = {
      text: `INSERT INTO reports (
        doctor_id, patient_id, report_start_date, report_end_date,
        diagnosis, diagnosis_details, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
      values: [
        reportData.doctorId,
        reportData.patientId,
        reportData.startDate,
        reportData.endDate,
        reportData.diagnosis,
        reportData.diagnosisDetails || null,
        reportData.status || 'active'
      ]
    };

    const result = await client.query(query);
    return result.rows[0];
  }

  // ID ile rapor bul
  static async findById(reportId) {
    const query = {
      text: `SELECT * FROM reports WHERE report_id = $1`,
      values: [reportId]
    };

    const result = await pool.query(query);
    return result.rows[0];
  }

  // Hasta ID ile raporları bul
  static async findByPatientId(patientId) {
    const query = {
      text: `SELECT * FROM reports WHERE patient_id = $1 ORDER BY created_at DESC`,
      values: [patientId]
    };

    const result = await pool.query(query);
    return result.rows;
  }

  // Doktor ID ile raporları bul
  static async findByDoctorId(doctorId) {
    const query = {
      text: `SELECT * FROM reports WHERE doctor_id = $1 ORDER BY created_at DESC`,
      values: [doctorId]
    };

    const result = await pool.query(query);
    return result.rows;
  }

  // Tüm raporları getir
  static async findAll() {
    const query = {
      text: `SELECT * FROM reports ORDER BY created_at DESC`
    };

    const result = await pool.query(query);
    return result.rows;
  }

  // Rapor güncelle
  static async update(client, reportId, updateData) {
    const query = {
      text: `UPDATE reports 
             SET patient_id = COALESCE($1, patient_id),
                 report_start_date = COALESCE($2, report_start_date),
                 report_end_date = COALESCE($3, report_end_date),
                 diagnosis = COALESCE($4, diagnosis),
                 diagnosis_details = COALESCE($5, diagnosis_details),
                 status = COALESCE($6, status),
                 updated_at = NOW()
             WHERE report_id = $7 
             RETURNING *`,
      values: [
        updateData.patientId,
        updateData.startDate,
        updateData.endDate,
        updateData.diagnosis,
        updateData.diagnosisDetails,
        updateData.status,
        reportId
      ]
    };

    const result = await client.query(query);
    return result.rows[0];
  }

  // Rapor durumunu güncelle
  static async updateStatus(reportId, newStatus) {
    const query = {
      text: `UPDATE reports 
             SET status = $1, updated_at = NOW() 
             WHERE report_id = $2 
             RETURNING *`,
      values: [newStatus, reportId]
    };

    const result = await pool.query(query);
    return result.rows[0];
  }

  // Rapor sil
  static async delete(client, reportId) {
    const query = {
      text: `DELETE FROM reports WHERE report_id = $1 RETURNING *`,
      values: [reportId]
    };

    const result = await client.query(query);
    return result.rows[0];
  }

  // Tarih aralığına göre raporlar
  static async findByDateRange(startDate, endDate) {
    const query = {
      text: `SELECT * FROM reports 
             WHERE created_at >= $1 AND created_at <= $2 
             ORDER BY created_at DESC`,
      values: [startDate, endDate]
    };

    const result = await pool.query(query);
    return result.rows;
  }

  // Durum bazlı raporlar
  static async findByStatus(status) {
    const query = {
      text: `SELECT * FROM reports WHERE status = $1 ORDER BY created_at DESC`,
      values: [status]
    };

    const result = await pool.query(query);
    return result.rows;
  }
}

// Rapor İlaçları Model
class ReportMedication {
  // İlaç ekle
  static async create(client, medicationData) {
    const query = {
      text: `INSERT INTO report_medications (
        report_id, medicine_name, dosage, frequency, duration, usage_instructions
      ) VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *`,
      values: [
        medicationData.reportId,
        medicationData.name,
        medicationData.dosage,
        medicationData.frequency || null,
        medicationData.duration || null,
        medicationData.instructions || null
      ]
    };

    const result = await client.query(query);
    return result.rows[0];
  }

  // Rapor ID ile ilaçları getir
  static async findByReportId(reportId) {
    const query = {
      text: `SELECT * FROM report_medications WHERE report_id = $1`,
      values: [reportId]
    };

    const result = await pool.query(query);
    return result.rows;
  }

  // Rapor ilaçlarını sil
  static async deleteByReportId(client, reportId) {
    const query = {
      text: `DELETE FROM report_medications WHERE report_id = $1`,
      values: [reportId]
    };

    await client.query(query);
  }
}

module.exports = { Report, ReportMedication };
