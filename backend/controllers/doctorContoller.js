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

// Doktorun başlatılabilir randevularını getir (10dk önce - 30dk sonrası)
exports.getActiveAppointments = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    const now = new Date();
    const minTime = new Date(now.getTime() - 30 * 60000); // 30dk önce
    const maxTime = new Date(now.getTime() + 10 * 60000); // 10dk sonrası
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
          AND a.datetime >= $2
          AND a.datetime <= $3
        ORDER BY a.datetime ASC`,
      [doctorId, minTime.toISOString(), maxTime.toISOString()]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Başlatılabilir randevular getirilirken hata oluştu:', err);
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
// Doktora randevu yapan hastaların bilgilerini getir
exports.getPatientsByDoctor = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    const result = await db.query(
      `SELECT DISTINCT
              u.user_id AS patient_id,
              u.full_name AS patient_name,
              u.email,
              u.phone_number,
              p.birth_date,
              p.gender,
              p.address,
              p.medical_history,
              a.doctor_id,
              COUNT(a.appointment_id) AS total_appointments,
              MAX(a.datetime) AS last_appointment_date,
              MIN(a.datetime) AS first_appointment_date
       FROM appointments a
       JOIN users u ON a.patient_id = u.user_id
       LEFT JOIN patient_profiles p ON u.user_id = p.user_id
       WHERE a.doctor_id = $1
       GROUP BY u.user_id, u.full_name, u.email, u.phone_number, p.birth_date, p.gender, p.address, p.medical_history, a.doctor_id`,
      [doctorId]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Hasta bilgileri getirilirken hata oluştu:', err);
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

exports.getDoctorPatients = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    const result = await db.query(`
      SELECT DISTINCT 
        p.user_id,
        u.full_name as name,
        u.email,
        u.phone_number as phone,
        pp.birth_date,
        pp.gender,
        pp.address,
        pp.medical_history,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, pp.birth_date)) as age,
        (
          SELECT TO_CHAR(MAX(datetime), 'YYYY-MM-DD')
          FROM appointments a2
          WHERE a2.patient_id = p.user_id 
          AND a2.doctor_id = $1
          AND a2.status = 'completed'
        ) as last_visit,
        (
          SELECT TO_CHAR(MIN(datetime), 'YYYY-MM-DD')
          FROM appointments a3
          WHERE a3.patient_id = p.user_id 
          AND a3.doctor_id = $1
          AND a3.datetime > CURRENT_TIMESTAMP
          AND a3.status = 'confirmed'
        ) as next_appointment,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM appointments a4
            WHERE a4.patient_id = p.user_id 
            AND a4.doctor_id = $1
            AND a4.status IN ('pending', 'confirmed')
          ) THEN 'active'
          ELSE 'inactive'
        END as status
      FROM appointments a
      JOIN users p ON a.patient_id = p.user_id
      JOIN users d ON a.doctor_id = d.user_id
      JOIN users u ON p.user_id = u.user_id
      JOIN patient_profiles pp ON p.user_id = pp.user_id
      WHERE a.doctor_id = $1
      AND u.role = 'patient'
      GROUP BY p.user_id, u.full_name, u.email, u.phone_number, pp.birth_date, pp.gender, pp.address, pp.medical_history
    `, [doctorId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching doctor patients:', err);
    res.status(500).json({ message: 'Hastalar getirilirken bir hata oluştu' });
  }
};

