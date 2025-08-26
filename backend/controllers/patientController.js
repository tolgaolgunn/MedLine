const { Pool } = require('pg');
const db = require('../config/db');
const { body, validationResult, param } = require('express-validator');
const { sendAppointmentConfirmation } = require('../services/mailService');

// Randevu oluşturma
exports.createAppointment = async (req, res) => {
  try {
    const { patient_id, doctor_id, datetime, type } = req.body;
    console.log("Gelen body:", req.body);

    if (!patient_id || !doctor_id || !datetime || !type) {
      return res.status(400).json({ message: 'Tüm alanlar zorunludur.' });
    }

    // ISO string'i PostgreSQL timestamp'ine çevir ve geçmiş kontrolü yap
    const parsedDate = new Date(datetime);
    const now = new Date();
    if (parsedDate.getTime() <= now.getTime()) {
      return res.status(409).json({
        message: 'Geçmiş bir saat için randevu alamazsınız.'
      });
    }

    // ISO formatında timestamp
    const timestampStr = parsedDate.toISOString();
    
    // Doktorun bu saatte randevusu var mı kontrol et (15 dakikalık pencere)
    const doctorConflictCheck = await db.query(
      `SELECT COUNT(*) as count FROM appointments 
       WHERE doctor_id = $1 
       AND datetime BETWEEN $2::timestamp - INTERVAL '15 minutes' 
       AND $2::timestamp + INTERVAL '15 minutes'`,
      [doctor_id, timestampStr]
    );

    if (parseInt(doctorConflictCheck.rows[0].count) > 0) {
      return res.status(409).json({ 
        message: 'Bu saatte doktorun başka bir randevusu bulunmaktadır.' 
      });
    }

    // Hastanın bu saatte başka randevusu var mı kontrol et (15 dakikalık pencere)
    const patientConflictCheck = await db.query(
      `SELECT COUNT(*) as count FROM appointments 
       WHERE patient_id = $1 
       AND datetime BETWEEN $2::timestamp - INTERVAL '15 minutes' 
       AND $2::timestamp + INTERVAL '15 minutes'`,
      [patient_id, timestampStr]
    );

    if (parseInt(patientConflictCheck.rows[0].count) > 0) {
      return res.status(409).json({ 
        message: 'Bu saatte başka bir randevunuz bulunmaktadır.' 
      });
    }

    // Randevuyu beklemede (pending) durumunda oluştur
    // Randevuyu oluştur
    const result = await db.query(
      `INSERT INTO appointments (patient_id, doctor_id, datetime, type, status) 
       VALUES ($1, $2, $3::timestamp, $4, 'pending') RETURNING *`,
      [patient_id, doctor_id, timestampStr, type]
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

// Hastanın tüm reçetelerini getir
exports.getMyPrescriptions = async (req, res) => {
  try {
    // user_id parametresini al
    const patientId = req.params.patientId || req.user?.user_id;
    console.log('Patient ID:', patientId); // Debug için

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Hasta ID\'si gereklidir'
      });
    }

    const query = `
      SELECT 
        p.prescription_id,
        p.prescription_code,
        p.diagnosis,
        p.general_instructions,
        p.usage_instructions,
        p.next_visit_date,
        p.status as prescription_status,
        p.created_at as prescription_date,
        u.full_name as doctor_name,
        dp.specialty as doctor_specialty,
        dp.hospital_name,
        dp.city,
        dp.district,
        a.datetime as appointment_date,
        a.type as appointment_type,
        json_agg(
          json_build_object(
            'item_id', pi.item_id,
            'medicine_name', pi.medicine_name,
            'dosage', pi.dosage,
            'frequency', pi.frequency,
            'duration', pi.duration,
            'usage_instructions', pi.usage_instructions,
            'side_effects', pi.side_effects,
            'quantity', pi.quantity
          )
        ) FILTER (WHERE pi.item_id IS NOT NULL) as medicines
      FROM prescriptions p
      LEFT JOIN users u ON p.doctor_id = u.user_id
      LEFT JOIN doctor_profiles dp ON u.user_id = dp.user_id
      LEFT JOIN appointments a ON p.appointment_id = a.appointment_id
      LEFT JOIN prescription_items pi ON p.prescription_id = pi.prescription_id
      WHERE p.patient_id = $1
      GROUP BY 
        p.prescription_id,
        p.prescription_code,
        p.diagnosis,
        p.general_instructions,
        p.usage_instructions,
        p.next_visit_date,
        p.status,
        p.created_at,
        u.full_name,
        dp.specialty,
        dp.hospital_name,
        dp.city,
        dp.district,
        a.datetime,
        a.type
      ORDER BY p.created_at DESC`;

    const result = await db.query(query, [patientId]);

    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Reçete bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching prescriptions:', err);
    res.status(500).json({
      success: false,
      message: 'Reçeteler alınırken bir hata oluştu',
      error: err.message
    });
  }
};

// Belirli bir reçetenin detaylarını getir
exports.getPrescriptionDetail = async (req, res) => {
  try {
    const { prescriptionId, patientId } = req.params;
    
    const query = `
      SELECT 
        p.prescription_id,
        p.prescription_code,
        p.diagnosis,
        p.general_instructions,
        p.usage_instructions,
        p.next_visit_date,
        p.status as prescription_status,
        p.created_at as prescription_date,
        
        u_doc.full_name as doctor_name,
        dp.specialty as doctor_specialty,
        dp.license_number,
        dp.hospital_name,
        dp.city,
        dp.district,
        dp.experience_years,
        
        u_pat.full_name as patient_name,
        pp.birth_date,
        pp.gender,
        
        a.datetime as appointment_date,
        a.type as appointment_type,
        
        json_agg(
          json_build_object(
            'item_id', pi.item_id,
            'medicine_name', pi.medicine_name,
            'dosage', pi.dosage,
            'frequency', pi.frequency,
            'duration', pi.duration,
            'usage_instructions', pi.usage_instructions,
            'side_effects', pi.side_effects,
            'quantity', pi.quantity
          )
        ) FILTER (WHERE pi.item_id IS NOT NULL) as medicines
        
      FROM prescriptions p
      LEFT JOIN users u_doc ON p.doctor_id = u_doc.user_id
      LEFT JOIN doctor_profiles dp ON u_doc.user_id = dp.user_id
      LEFT JOIN users u_pat ON p.patient_id = u_pat.user_id
      LEFT JOIN patient_profiles pp ON u_pat.user_id = pp.user_id
      LEFT JOIN appointments a ON p.appointment_id = a.appointment_id
      LEFT JOIN prescription_items pi ON p.prescription_id = pi.prescription_id
      WHERE p.prescription_id = $1 AND p.patient_id = $2
      GROUP BY 
        p.prescription_id,
        p.prescription_code,
        p.diagnosis,
        p.general_instructions,
        p.usage_instructions,
        p.next_visit_date,
        p.status,
        p.created_at,
        u_doc.full_name,
        dp.specialty,
        dp.license_number,
        dp.hospital_name,
        dp.city,
        dp.district,
        dp.experience_years,
        u_pat.full_name,
        pp.birth_date,
        pp.gender,
        a.datetime,
        a.type`;

    const result = await db.query(query, [prescriptionId, patientId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reçete bulunamadı'
      });
    }

    const prescriptionDetail = {
      ...result.rows[0],
      doctor: {
        name: result.rows[0].doctor_name,
        specialty: result.rows[0].doctor_specialty,
        license_number: result.rows[0].license_number,
        hospital_name: result.rows[0].hospital_name,
        city: result.rows[0].city,
        district: result.rows[0].district,
        experience_years: result.rows[0].experience_years
      },
      patient: {
        name: result.rows[0].patient_name,
        birth_date: result.rows[0].birth_date,
        gender: result.rows[0].gender
      },
      appointment: {
        date: result.rows[0].appointment_date,
        type: result.rows[0].appointment_type
      },
      medicines: result.rows[0].medicines || []
    };

    res.status(200).json({
      success: true,
      data: prescriptionDetail
    });
  } catch (err) {
    console.error('Error fetching prescription detail:', err);
    res.status(500).json({
      success: false,
      message: 'Reçete detayları alınırken bir hata oluştu'
    });
  }
};

// Reçete durumunu güncelle
exports.updatePrescriptionStatus = async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const { status } = req.body;

    const query = `
      UPDATE prescriptions 
      SET 
        status = $1, 
        updated_at = CURRENT_TIMESTAMP 
      WHERE prescription_id = $2 
      RETURNING *
    `;

    const result = await db.query(query, [status, prescriptionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reçete bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reçete durumu güncellendi',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating prescription status:', err);
    res.status(500).json({
      success: false,
      message: 'Reçete durumu güncellenirken bir hata oluştu'
    });
  }
};

// Randevu silme
exports.deleteAppointment = async (req, res) => {
  try {
    const { appointmentId, patientId } = req.params;

    // Önce randevunun varlığını ve hastaya ait olduğunu kontrol et
    const checkQuery = `
      SELECT * FROM appointments 
      WHERE appointment_id = $1 AND patient_id = $2
    `;
    
    const checkResult = await db.query(checkQuery, [appointmentId, patientId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Randevu bulunamadı veya bu randevuyu silme yetkiniz yok'
      });
    }

    // Randevuyu sil
    const deleteQuery = `
      DELETE FROM appointments 
      WHERE appointment_id = $1 AND patient_id = $2 
      RETURNING *
    `;

    const result = await db.query(deleteQuery, [appointmentId, patientId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Randevu silinirken bir hata oluştu'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Randevu başarıyla silindi',
      data: result.rows[0]
    });

  } catch (err) {
    console.error('Randevu silme hatası:', err);
    res.status(500).json({
      success: false,
      message: 'Randevu silinirken bir hata oluştu'
    });
  }
};

// Validation functions
const validateFeedback = (req, res, next) => {
  const errors = [];
  const { feedback_type, title, message } = req.body;

  if (!['ui_interface', 'appointment_issue', 'technical_support', 'other'].includes(feedback_type)) {
    errors.push({ field: 'feedback_type', message: 'Invalid feedback type' });
  }

  if (!title || title.trim().length === 0 || title.trim().length > 100) {
    errors.push({ field: 'title', message: 'Title must be between 1 and 100 characters' });
  }

  if (!message || message.trim().length === 0 || message.trim().length > 500) {
    errors.push({ field: 'message', message: 'Message must be between 1 and 500 characters' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  }

  next();
};
// Get user feedbacks
exports.getUserFeedbacks = async (req, res) => {
  try {
    const { userId } = req.params;

    const query = `
      SELECT 
        f.*,
        u.full_name as user_name
      FROM feedbacks f
      JOIN users u ON f.user_id = u.user_id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
    `;

    const result = await db.query(query, [userId]);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching feedbacks:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Geri bildirimler alınırken bir hata oluştu' 
    });
  }
};

// Create feedback
exports.createFeedback = async (req, res) => {
  try {
    const { user_id, feedback_type, title, message } = req.body;

    const query = `
      INSERT INTO feedbacks (
        user_id, 
        feedback_type, 
        title, 
        message, 
        status
      )
      VALUES ($1, $2, $3, $4, 'submitted')
      RETURNING *
    `;

    const result = await db.query(query, [
      user_id,
      feedback_type,
      title,
      message
    ]);

    res.status(201).json({
      success: true,
      message: 'Geri bildirim başarıyla oluşturuldu',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error creating feedback:', err);
    res.status(500).json({
      success: false,
      message: 'Geri bildirim oluşturulurken bir hata oluştu'
    });
  }
};

// Update feedback
exports.updateFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { feedback_type, title, message } = req.body;

    const query = `
      UPDATE feedbacks 
      SET 
        feedback_type = $1,
        title = $2,
        message = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE feedback_id = $4
      RETURNING *
    `;

    const result = await db.query(query, [
      feedback_type,
      title,
      message,
      feedbackId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Geri bildirim bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Geri bildirim başarıyla güncellendi',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating feedback:', err);
    res.status(500).json({
      success: false,
      message: 'Geri bildirim güncellenirken bir hata oluştu'
    });
  }
};

// Delete feedback
exports.deleteFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;

    const query = `
      DELETE FROM feedbacks 
      WHERE feedback_id = $1 
      RETURNING *
    `;

    const result = await db.query(query, [feedbackId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Geri bildirim bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Geri bildirim başarıyla silindi'
    });
  } catch (err) {
    console.error('Error deleting feedback:', err);
    res.status(500).json({
      success: false,
      message: 'Geri bildirim silinirken bir hata oluştu'
    });
  }
};