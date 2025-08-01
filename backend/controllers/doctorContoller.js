const db = require('../config/db');

// Doktorun toplam hasta sayısını getir
exports.getPatientCount = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    
    const result = await db.query(
      `SELECT COUNT(DISTINCT patient_id) as count
       FROM appointments
       WHERE doctor_id = $1`,
      [doctorId]
    );
    
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('Hasta sayısı getirilirken hata oluştu:', err);
    res.status(500).json({ message: err.message });
  }
};

// Doktorun bekleyen randevu sayısını getir
exports.getPendingAppointmentCount = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    
    const result = await db.query(
      `SELECT COUNT(*) as count
       FROM appointments
       WHERE doctor_id = $1 AND status = 'pending'`,
      [doctorId]
    );
    
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('Bekleyen randevu sayısı getirilirken hata oluştu:', err);
    res.status(500).json({ message: err.message });
  }
};

// Doktorun bugünkü randevu sayısını getir
exports.getTodayAppointmentCount = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    const today = new Date().toISOString().split('T')[0];     
    const result = await db.query(
      `SELECT COUNT(*) as count
       FROM appointments
       WHERE doctor_id = $1 AND DATE(datetime) = $2`,
      [doctorId, today]
    );
    
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('Bugünkü randevu sayısı getirilirken hata oluştu:', err);
    res.status(500).json({ message: err.message });
  }
};

// Doktora ait randevuları getir
exports.getAppointmentsByDoctor = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    const result = await db.query(
      `SELECT a.appointment_id AS id,
              a.patient_id,
              u.full_name AS patientName,
              a.datetime,
              a.type,
              a.status,
              d.specialty
         FROM appointments a
         JOIN users u ON a.patient_id = u.user_id
         JOIN doctor_profiles d ON a.doctor_id = d.user_id
        WHERE a.doctor_id = $1
        ORDER BY a.datetime ASC`,
      [doctorId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Doktorun randevuları getirilirken hata oluştu:', err);
    res.status(500).json({ message: err.message });
  }
};

// Doktor: Randevu durumunu güncelle
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const appointmentId = req.params.appointmentId;
    const { status } = req.body;
    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Geçersiz durum.' });
    }
    const result = await db.query(
      `UPDATE appointments SET status = $1, updated_at = NOW() WHERE appointment_id = $2 RETURNING *`,
      [status, appointmentId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Randevu bulunamadı.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

