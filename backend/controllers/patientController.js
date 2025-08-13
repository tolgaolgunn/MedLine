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

    // Geçmiş saat için randevu alınamaz kontrolü
    const appointmentDate = new Date(datetime);
    const now = new Date();
    if (
      appointmentDate.toDateString() === now.toDateString() &&
      appointmentDate.getTime() <= now.getTime()
    ) {
      return res.status(409).json({
        message: 'Geçmiş bir saat için randevu alamazsınız.'
      });
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
    const patientId = req.params.patientId;
    
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
        du.full_name as doctor_name,
        dp.specialty as doctor_specialty,
        dp.hospital_name,
        dp.city,
        dp.district,
        a.datetime as appointment_date,
        a.type as appointment_type,
        pi.medicine_name,
        pi.dosage,
        pi.frequency,
        pi.duration,
        pi.usage_instructions as medicine_instructions
      FROM prescriptions p
      INNER JOIN users du ON p.doctor_id = du.user_id
      INNER JOIN doctor_profiles dp ON du.user_id = dp.user_id
      LEFT JOIN appointments a ON p.appointment_id = a.appointment_id
      LEFT JOIN prescription_items pi ON p.prescription_id = pi.prescription_id
      WHERE p.patient_id = $1
      ORDER BY p.created_at DESC`;

    const result = await db.query(query, [patientId]);
    
    // Reçeteleri grupla
    const prescriptions = result.rows.reduce((acc, row) => {
      const prescription = acc.find(p => p.prescription_id === row.prescription_id);
      
      if (prescription) {
        // İlacı mevcut reçeteye ekle
        prescription.medicines.push({
          name: row.medicine_name,
          dosage: row.dosage,
          frequency: row.frequency,
          duration: row.duration,
          instructions: row.medicine_instructions
        });
      } else {
        // Yeni reçete oluştur
        acc.push({
          prescription_id: row.prescription_id,
          prescription_code: row.prescription_code,
          diagnosis: row.diagnosis,
          general_instructions: row.general_instructions,
          usage_instructions: row.usage_instructions,
          next_visit_date: row.next_visit_date,
          status: row.prescription_status,
          created_at: row.prescription_date,
          doctor: {
            name: row.doctor_name,
            specialty: row.doctor_specialty,
            hospital: row.hospital_name,
            city: row.city,
            district: row.district
          },
          appointment: {
            date: row.appointment_date,
            type: row.appointment_type
          },
          medicines: row.medicine_name ? [{
            name: row.medicine_name,
            dosage: row.dosage,
            frequency: row.frequency,
            duration: row.duration,
            instructions: row.medicine_instructions
          }] : []
        });
      }
      return acc;
    }, []);

    res.status(200).json({
      success: true,
      data: prescriptions
    });
  } catch (err) {
    console.error('Reçeteler alınırken hata:', err);
    res.status(500).json({
      success: false,
      message: 'Reçeteler alınırken bir hata oluştu'
    });
  }
};

// Belirli bir reçetenin detaylarını getir
exports.getPrescriptionDetail = async (req, res) => {
  try {
    const { prescriptionId, patientId } = req.params;
    
    const query = `
      SELECT 
        p.*,
        du.full_name as doctor_name,
        dp.specialty as doctor_specialty,
        dp.hospital_name,
        a.datetime as appointment_date,
        a.type as appointment_type,
        json_agg(json_build_object(
          'name', pi.medicine_name,
          'dosage', pi.dosage,
          'frequency', pi.frequency,
          'duration', pi.duration,
          'instructions', pi.usage_instructions
        )) as medicines
      FROM prescriptions p
      INNER JOIN users du ON p.doctor_id = du.user_id
      INNER JOIN doctor_profiles dp ON du.user_id = dp.user_id
      LEFT JOIN appointments a ON p.appointment_id = a.appointment_id
      LEFT JOIN prescription_items pi ON p.prescription_id = pi.prescription_id
      WHERE p.prescription_id = $1 AND p.patient_id = $2
      GROUP BY p.prescription_id, du.full_name, dp.specialty, dp.hospital_name, a.datetime, a.type`;

    const result = await db.query(query, [prescriptionId, patientId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reçete bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Reçete detayı alınırken hata:', err);
    res.status(500).json({
      success: false,
      message: 'Reçete detayı alınırken bir hata oluştu'
    });
  }
};

// Reçete durumunu güncelle
exports.updatePrescriptionStatus = async (req, res) => {
  try {
    const { prescriptionId, patientId } = req.params;
    const { status } = req.body;

    if (!['active', 'used', 'expired', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz reçete durumu'
      });
    }

    const query = `
      UPDATE prescriptions 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE prescription_id = $2 AND patient_id = $3
      RETURNING *`;

    const result = await db.query(query, [status, prescriptionId, patientId]);

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
    console.error('Reçete durumu güncellenirken hata:', err);
    res.status(500).json({
      success: false,
      message: 'Reçete durumu güncellenirken bir hata oluştu'
    });
  }
};

