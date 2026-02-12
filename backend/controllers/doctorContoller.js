const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { sendAppointmentConfirmation, sendAppointmentRejection } = require('../services/mailService');
const MedicalResultModel = require('../models/medicalResultModel');
const NotificationModel = require('../models/notificationModel');
const { getUserByEmail, getUserByNationalId, createUser } = require('../models/userModel');
const { createPatientProfile } = require('../models/patientProfileModel');

// Helper function for database queries
const query = async (sql, params) => {
  try {
    return await db.query(sql, params);
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  }
};

// Doctor Statistics
exports.getPatientCount = async (req, res) => {
  try {
    const { doctorId } = req.params;
    console.log('Getting patient count for doctorId:', doctorId);

    // Önce doktorun var olduğunu kontrol et
    const doctorCheck = await query(
      `SELECT user_id FROM users WHERE user_id = $1 AND role = 'doctor'`,
      [doctorId]
    );

    if (doctorCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Doktor bulunamadı' });
    }

    const result = await query(
      `SELECT COUNT(DISTINCT patient_id) as count
       FROM appointments
       WHERE doctor_id = $1`,
      [doctorId]
    );

    console.log('Patient count result:', result.rows[0]);
    res.json({ count: parseInt(result.rows[0].count) || 0 });
  } catch (err) {
    console.error('Error getting patient count:', err);
    res.status(500).json({ message: 'Hasta sayısı alınırken hata oluştu' });
  }
};

exports.getPendingAppointmentCount = async (req, res) => {
  try {
    const { doctorId } = req.params;
    console.log('Getting pending appointments for doctorId:', doctorId);

    const result = await query(
      `SELECT COUNT(*) as count
       FROM appointments
       WHERE doctor_id = $1 AND status = 'pending'`,
      [doctorId]
    );

    console.log('Pending appointments result:', result.rows[0]);
    res.json({ count: parseInt(result.rows[0].count) || 0 });
  } catch (err) {
    console.error('Error getting pending appointments:', err);
    res.status(500).json({ message: 'Bekleyen randevular alınırken hata oluştu' });
  }
};

exports.getTodayAppointmentCount = async (req, res) => {
  try {
    const { doctorId } = req.params;
    console.log('Getting today appointments for doctorId:', doctorId);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const result = await query(
      `SELECT COUNT(*) as count
       FROM appointments
       WHERE doctor_id = $1 
       AND datetime >= $2 
       AND datetime < $3`,
      [doctorId, todayStart.toISOString(), todayEnd.toISOString()]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('Error getting today appointments:', err);
    res.status(500).json({ message: 'Failed to get today appointments' });
  }
};

exports.getPrescriptionCount = async (req, res) => {
  try {
    const { doctorId } = req.params;
    console.log('Getting prescription count for doctorId:', doctorId);

    // Sadece aktif reçeteleri say (cancelled olmayanları)
    const result = await query(
      `SELECT COUNT(*) as count
       FROM prescriptions
       WHERE doctor_id = $1 
       AND (status IS NULL OR status != 'cancelled')`,
      [doctorId]
    );

    console.log('Prescription count result:', result.rows[0]);
    const count = parseInt(result.rows[0].count) || 0;
    console.log('Final prescription count:', count);
    res.json({ count });
  } catch (err) {
    console.error('Error getting prescription count:', err);
    res.status(500).json({ message: 'Reçete sayısı alınırken hata oluştu' });
  }
};

// Appointment Management
exports.getActiveAppointments = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const now = new Date();
    const minTime = new Date(now.getTime() - 30 * 60000);
    const maxTime = new Date(now.getTime() + 10 * 60000);

    const result = await query(
      `SELECT a.appointment_id AS id,
              a.patient_id,
              u.full_name AS patientName,
              TO_CHAR(a.datetime, 'YYYY-MM-DD"T"HH24:MI:SS') as datetime,
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
    console.error('Error getting active appointments:', err);
    res.status(500).json({ message: 'Failed to get active appointments' });
  }
};


exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status, reason } = req.body;

    if (!["pending", "confirmed", "cancelled", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const appointmentResult = await query(
      `
      SELECT 
        a.*,
        u.email AS patient_email,
        u.full_name AS patient_name,
        d.full_name AS doctor_name,
        dp.specialty AS doctor_specialty
      FROM appointments a
      JOIN users u ON a.patient_id = u.user_id
      JOIN users d ON a.doctor_id = d.user_id
      JOIN doctor_profiles dp ON a.doctor_id = dp.user_id
      WHERE a.appointment_id = $1
      `,
      [appointmentId]
    );

    if (appointmentResult.rowCount === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const result = await query(
      `
      UPDATE appointments 
      SET status = $1, updated_at = NOW() 
      WHERE appointment_id = $2 
      RETURNING *
      `,
      [status, appointmentId]
    );

    const appointmentData = appointmentResult.rows[0];
    const {
      patient_id,
      patient_email,
      doctor_name,
      doctor_specialty,
      datetime,
      type,
    } = appointmentData;

    const formattedDate = new Date(datetime).toLocaleDateString("tr-TR");
    const formattedTime = new Date(datetime).toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    console.log(
      `updateAppointmentStatus → status:${status}, appointment:${appointmentId}`
    );

    if (status === "confirmed") {
      const appointmentDetails = {
        doctorName: doctor_name,
        doctorSpecialty: doctor_specialty,
        date: formattedDate,
        time: formattedTime,
        location: "MedLine Hastanesi",
        appointmentType: type,
      };

      console.log(
          `[MAIL][RANDEVU_ONAY] Onay maili hazırlanıyor → Hasta: ${patient_email} | Doktor: ${doctor_name} | Tarih: ${formattedDate} ${formattedTime}`
        );
        sendAppointmentConfirmation(
          patient_email,
          appointmentDetails
        ).then(() => {
          console.log(
            `[MAIL][RANDEVU_ONAY] Onay maili başarıyla gönderildi → ${patient_email}`
          );
        }).catch (mailError => {
          console.error(
            "[MAIL][RANDEVU_ONAY] Onay maili gönderilirken hata oluştu:",
            mailError
          );
        });

      const notificationData = {
        userId: patient_id,
        title: "Randevu Onaylandı",
        message: `Dr. ${doctor_name} ile ${formattedDate} tarihinde saat ${formattedTime} için randevunuz onaylandı.`,
        type: "appointment",
      };

      try {
        const savedNotification =
          await NotificationModel.createNotification(notificationData);

        if (req.io) {
          req.io.to(String(patient_id)).emit("notification", {
            id: savedNotification.notification_id,
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type,
            read: false,
            timestamp: savedNotification.created_at,
          });
        }
      } catch (notifError) {
        console.error("Notification error:", notifError);
      }
    }

    if (status === "cancelled") {
      const appointmentDetails = {
        doctorName: doctor_name,
        doctorSpecialty: doctor_specialty,
        date: formattedDate,
        time: formattedTime,
        reason,
      };

      sendAppointmentRejection(
          patient_email,
          appointmentDetails
      ).then(() => {
        console.log("Rejection mail sent");
      }).catch (err => {
        console.error("Rejection mail failed:", err);
      });

      const notificationData = {
        userId: patient_id,
        title: "Randevu İptal Edildi",
        message: `Dr. ${doctor_name} ile ${formattedDate} tarihinde saat ${formattedTime} için randevunuz iptal edildi${
          reason ? " | Sebep: " + reason : ""
        }`,
        type: "appointment",
      };

      try {
        const savedNotification =
          await NotificationModel.createNotification(notificationData);

        if (req.io) {
          req.io.to(String(patient_id)).emit("notification", {
            id: savedNotification.notification_id,
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type,
            read: false,
            timestamp: savedNotification.created_at,
          });
        }
      } catch (notifError) {
        console.error("Notification error:", notifError);
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("updateAppointmentStatus error:", err);
    res.status(500).json({ message: "Failed to update appointment status" });
  }
};


// Patient Management
exports.getAppointmentsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    console.log('Fetching appointments for doctor:', doctorId);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());

    const result = await query(
      `SELECT 
          a.appointment_id,
          a.patient_id,
          u.full_name AS "patientName",
          pp.birth_date,
          CASE 
            WHEN pp.birth_date IS NOT NULL THEN
              FLOOR(EXTRACT(YEAR FROM age(current_date, pp.birth_date))) -- FLOOR ekledik
            ELSE 0
          END as "patientAge",
          TO_CHAR(a.datetime AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS') as datetime,
          a.type,
          a.status,
          d.specialty
       FROM appointments a
       JOIN users u ON a.patient_id = u.user_id
       JOIN doctor_profiles d ON a.doctor_id = d.user_id
       LEFT JOIN patient_profiles pp ON a.patient_id = pp.user_id
       WHERE a.doctor_id = $1
         AND a.datetime >= $2
         AND a.status != 'cancelled'
       ORDER BY a.datetime ASC`,
      [doctorId, today.toISOString()]
    );
    
    console.log('Raw SQL result:', JSON.stringify(result.rows, null, 2));

    // Format the response data - yaş değerini Math.floor ile güvence altına al
    const formattedAppointments = result.rows.map(appointment => {
      return {
        appointment_id: appointment.appointment_id,
        patient_id: appointment.patient_id,
        patientName: appointment.patientName || 'İsimsiz Hasta',
        patientAge: Math.floor(parseFloat(appointment.patientAge || 0)), // Double Math.floor
        datetime: appointment.datetime,
        type: appointment.type,
        status: appointment.status,
        specialty: appointment.specialty,
        symptoms: appointment.symptoms || ''
      };
    });

    res.json(formattedAppointments);
  } catch (err) {
    console.error('Error getting doctor appointments:', err);
    res.status(500).json({ 
      message: 'Randevular alınırken bir hata oluştu',
      error: err.message 
    });
  }
};

// Patient Management
exports.getPatientsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    console.log('Getting patients for doctor ID:', doctorId);
    
    const result = await query(
      `SELECT
              u.user_id AS patient_id,
              u.full_name AS patient_name,
              u.email,
              u.phone_number,
              p.birth_date,
              p.gender,
              p.address,
              p.medical_history,
              p.blood_type,
              a.doctor_id,
              COUNT(a.appointment_id) AS total_appointments,
              TO_CHAR(MAX(a.datetime) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS') AS last_appointment_date,
              TO_CHAR(MIN(a.datetime) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS') AS first_appointment_date
       FROM appointments a
       JOIN users u ON a.patient_id = u.user_id
       LEFT JOIN patient_profiles p ON u.user_id = p.user_id
       WHERE a.doctor_id = $1
       GROUP BY u.user_id, u.full_name, u.email, u.phone_number, 
                p.birth_date, p.gender, p.address, p.medical_history, p.blood_type, a.doctor_id
       ORDER BY MAX(a.datetime) DESC`,
      [doctorId]
    );
    
    console.log(`Found ${result.rows.length} patients for doctor ${doctorId}`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error getting patients:', err);
    res.status(500).json({ message: 'Failed to get patients' });
  }
};

exports.getDoctorPatients = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const result = await query(`
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
      GROUP BY p.user_id, u.full_name, u.email, u.phone_number, 
               pp.birth_date, pp.gender, pp.address, pp.medical_history
    `, [doctorId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching doctor patients:', err);
    res.status(500).json({ message: 'Failed to get doctor patients' });
  }
};

// Medical Results Management - Doktor için (sadece metin)
exports.addMedicalResult = async (req, res) => {
  try {
    const doctorId = req.user?.user_id;
    const { patientId, title, details, recordType } = req.body;

    if (!doctorId) {
      return res.status(401).json({
        success: false,
        message: 'Doktor bilgisi bulunamadı',
      });
    }

    if (!patientId || !title || !details) {
      return res.status(400).json({
        success: false,
        message: 'patientId, title ve details alanları zorunludur',
      });
    }

    const createdResult = await MedicalResultModel.createMedicalResult({
      doctorId,
      patientId,
      title: title.trim(),
      details: details.trim(),
      recordType: recordType || 'Diğer',
    });

    // Create notification message
    const notificationData = {
      userId: patientId,
      title: 'Yeni Tahlil Sonucu',
      message: `Doktorunuz yeni bir sonuç ekledi: ${title}`,
      type: 'result'
    };

    // Save notification to database
    let savedNotification;
    try {
      savedNotification = await NotificationModel.createNotification(notificationData);
    } catch (notifError) {
      console.error('Error saving notification:', notifError);
    }

    // Send real-time notification to the patient
    if (req.io) {
      console.log(`Emitting result notification to patient room: ${patientId}`);
      req.io.to(String(patientId)).emit('notification', {
        id: savedNotification ? savedNotification.notification_id : Date.now(),
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        read: false,
        timestamp: savedNotification ? savedNotification.created_at : new Date().toISOString()
      });
    }

    return res.status(201).json({
      success: true,
      data: createdResult,
    });
  } catch (err) {
    console.error('Error adding medical result:', err);
    return res.status(500).json({
      success: false,
      message: 'Sonuç kaydedilirken bir hata oluştu',
    });
  }
};

// Dosyalı tıbbi sonuç ekleme (PDF / görsel eklenmiş)
exports.addMedicalResultWithFiles = async (req, res) => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const doctorId = req.user?.user_id;
    const { patientId, title, details, recordType } = req.body;
    const files = req.files || [];

    if (!doctorId) {
      await client.query('ROLLBACK');
      return res.status(401).json({
        success: false,
        message: 'Doktor bilgisi bulunamadı',
      });
    }

    if (!patientId || !title || !details) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'patientId, title ve details alanları zorunludur',
      });
    }


    const resultInsert = await client.query(
      `INSERT INTO medical_results (doctor_id, patient_id, title, details, record_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [doctorId, patientId, title.trim(), details.trim(), recordType || 'Diğer']
    );

    const createdResult = resultInsert.rows[0];

    // Dosyaları medical_result_files tablosuna kaydet
    const savedFiles = [];
    for (const file of files) {
      const relativePath = `/uploads/${file.filename}`;
      const fileInsert = await client.query(
        `INSERT INTO medical_result_files (result_id, file_path, original_name, mime_type)
         VALUES ($1, $2, $3, $4)
         RETURNING file_id, file_path, original_name, mime_type, created_at`,
        [createdResult.result_id, relativePath, file.originalname, file.mimetype]
      );
      savedFiles.push(fileInsert.rows[0]);
    }

    await client.query('COMMIT');

    await client.query('COMMIT');

    // Create notification message
    const notificationData = {
      userId: patientId,
      title: 'Yeni Tahlil Sonucu',
      message: `Doktorunuz yeni bir sonuç dosyası ekledi: ${title}`,
      type: 'result'
    };

    // Save notification to database (we need to do this OUTSIDE the transaction or use a separate connection if we want it to persist even if the main transaction fails - but here we only want it if success, so it's fine. Wait, NotificationModel uses 'pool' directly, so it's outside this client's transaction. That's actually good here since we committed already.)
    
    let savedNotification;
    try {
      savedNotification = await NotificationModel.createNotification(notificationData);
    } catch (notifError) {
      console.error('Error saving notification:', notifError);
    }

    // Send real-time notification to the patient
    if (req.io) {
      console.log(`Emitting result notification to patient room: ${patientId}`);
      req.io.to(String(patientId)).emit('notification', {
        id: savedNotification ? savedNotification.notification_id : Date.now(),
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        read: false,
        timestamp: savedNotification ? savedNotification.created_at : new Date().toISOString()
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        ...createdResult,
        files: savedFiles,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error adding medical result with files:', err);
    return res.status(500).json({
      success: false,
      message: 'Sonuç ve ekleri kaydedilirken bir hata oluştu',
    });
  } finally {
    client.release();
  }
};

// Doktor için hasta ekleme
exports.addPatient = async (req, res) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    const doctorId = req.user?.user_id;
    const { 
      full_name, 
      email, 
      password, 
      phone_number, 
      birth_date, 
      gender, 
      address, 
      national_id, 
      blood_type,
      medical_history 
    } = req.body;

    if (!doctorId) {
      await client.query('ROLLBACK');
      return res.status(401).json({ 
        success: false,
        message: "Doktor bilgisi bulunamadı" 
      });
    }

    // E-posta kontrolü
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false,
        message: "Bu e-posta ile kayıtlı kullanıcı zaten var." 
      });
    }

    // TC Kimlik kontrolü
    if (national_id) {
      const existingNationalId = await getUserByNationalId(national_id);
      if (existingNationalId) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          success: false,
          message: "Bu TC Kimlik numarası ile kayıtlı kullanıcı zaten var." 
        });
      }
    }

    // Zorunlu alanların kontrolü
    if (!full_name || !email || !password) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false,
        message: "Ad-soyad, e-posta ve şifre alanları zorunludur." 
      });
    }

    // Şifre hash'leme
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Telefon numarasını temizle (varsa +90 gibi prefix'leri kaldır)
    let cleanPhoneNumber = phone_number;
    if (phone_number && phone_number.startsWith('+90')) {
      cleanPhoneNumber = phone_number.replace('+90', '').trim();
    }

    // Kullanıcı oluşturma (transaction içinde)
    const turkeyTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
    const userResult = await client.query(
      `INSERT INTO users (full_name, email, password_hash, phone_number, role, is_approved, national_id, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8) 
       RETURNING *`,
      [full_name, email, password_hash, cleanPhoneNumber || phone_number, "patient", true, national_id, turkeyTime]
    );
    
    const user = userResult.rows[0];
    
    if (!user || !user.user_id) {
      await client.query('ROLLBACK');
      return res.status(500).json({ 
        success: false,
        message: "Kullanıcı oluşturulamadı" 
      });
    }
    
    // Hasta profili oluşturma (transaction içinde)
    try {
      // Tarih formatını düzelt
      let dbBirthDate = birth_date ? new Date(birth_date).toISOString().split('T')[0] : null;
      
      // Gender değerini veritabanı formatına çevir
      let dbGender = null;
      if (gender) {
        const genderTrimmed = gender.trim();
        const genderLower = genderTrimmed.toLowerCase();
        console.log('Original gender value:', JSON.stringify(gender), 'Trimmed:', JSON.stringify(genderTrimmed), 'Lowercase:', genderLower);
        
        // Türkçe değerleri kontrol et
        if (genderTrimmed === 'Erkek' || genderLower === 'erkek' || genderLower === 'male' || genderLower === 'm') {
          dbGender = 'male';
        } else if (genderTrimmed === 'Kadın' || genderLower === 'kadın' || genderLower === 'kadin' || genderLower === 'female' || genderLower === 'f') {
          dbGender = 'female';
        } else if (genderTrimmed === 'Belirtmek istemiyorum' || genderLower === 'belirtmek istemiyorum' || genderLower === 'other' || genderLower === 'diğer' || genderLower === 'belirtmemek') {
          dbGender = 'other';
        } else {
          // Eğer tanınmayan bir değer gelirse, null bırak (CHECK constraint hatası vermemesi için)
          console.warn('Unknown gender value:', JSON.stringify(gender), '- setting to null');
          dbGender = null;
        }
      }
      
      console.log('Converted gender value:', dbGender);
      
      // Blood type kontrolü - geçersiz değerler için null yap
      // Frontend'den "O+" veya "O-" gelebilir, bunları "0+" ve "0-" olarak düzelt
      let dbBloodType = blood_type || null;
      if (dbBloodType) {
        // "O" harfini "0" (sıfır) ile değiştir
        dbBloodType = dbBloodType.replace(/^O([+-])$/, '0$1');
      }
      const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'];
      if (dbBloodType && !validBloodTypes.includes(dbBloodType)) {
        console.warn('Invalid blood type:', blood_type, '->', dbBloodType, '- setting to null');
        dbBloodType = null;
      }
      
      console.log('Inserting patient profile with values:', {
        user_id: user.user_id,
        birth_date: dbBirthDate,
        gender: dbGender,
        address: address || null,
        medical_history: medical_history || null,
        blood_type: dbBloodType
      });
      
      const profileResult = await client.query(
        `INSERT INTO patient_profiles (user_id, birth_date, gender, address, medical_history, blood_type)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [user.user_id, dbBirthDate, dbGender, address || null, medical_history || null, dbBloodType]
      );
      
      console.log('Patient profile created successfully:', profileResult.rows[0] ? 'Yes' : 'No');
      
      if (!profileResult.rows[0]) {
        await client.query('ROLLBACK');
        return res.status(500).json({ 
          success: false,
          message: "Hasta profili oluşturulamadı" 
        });
      }
    } catch (profileError) {
      await client.query('ROLLBACK');
      console.error('Error creating patient profile:', profileError);
      console.error('Profile error details:', {
        code: profileError.code,
        detail: profileError.detail,
        constraint: profileError.constraint,
        message: profileError.message,
        stack: profileError.stack
      });
      console.error('Values that caused error:', {
        user_id: user.user_id,
        birth_date: dbBirthDate,
        gender: dbGender,
        address: address || null,
        medical_history: medical_history || null,
        blood_type: blood_type || null
      });
      return res.status(500).json({ 
        success: false,
        message: "Hasta profili oluşturulurken bir hata oluştu",
        error: profileError.message,
        code: profileError.code,
        detail: profileError.detail,
        constraint: profileError.constraint,
        debug: {
          gender_received: gender,
          gender_converted: dbGender,
          blood_type: blood_type
        }
      });
    }

    // Doktor ile hasta arasında ilk randevu oluştur (ilişki kurmak için)
    // Bu randevu hasta listesinde görünmesi için gerekli - KRİTİK!
    try {
      const appointmentDate = new Date();
      // Türkiye saatine göre ayarla
      const turkeyAppointmentDate = new Date(appointmentDate.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
      
      const appointmentResult = await client.query(
        `INSERT INTO appointments (doctor_id, patient_id, datetime, type, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING appointment_id`,
        [
          doctorId,
          user.user_id,
          turkeyAppointmentDate,
          'face_to_face', // İlk kayıt için yüz yüze
          'completed' // İlk kayıt için completed
        ]
      );
      
      if (!appointmentResult.rows[0] || !appointmentResult.rows[0].appointment_id) {
        await client.query('ROLLBACK');
        console.error('Error: Appointment created but no ID returned');
        return res.status(500).json({ 
          success: false,
          message: "Hasta oluşturuldu ancak randevu kaydı oluşturulamadı. Hasta listede görünmeyebilir." 
        });
      }
      
      console.log('Appointment created successfully:', appointmentResult.rows[0].appointment_id);
      console.log('Appointment details:', {
        appointment_id: appointmentResult.rows[0].appointment_id,
        doctor_id: doctorId,
        patient_id: user.user_id,
        datetime: turkeyAppointmentDate,
        type: 'face_to_face',
        status: 'completed'
      });
    } catch (appointmentError) {
      // Randevu oluşturma hatası - KRİTİK! Rollback yap
      await client.query('ROLLBACK');
      console.error('Error creating initial appointment:', appointmentError);
      console.error('Appointment error details:', {
        code: appointmentError.code,
        detail: appointmentError.detail,
        constraint: appointmentError.constraint,
        message: appointmentError.message,
        stack: appointmentError.stack
      });
      return res.status(500).json({ 
        success: false,
        message: "Hasta oluşturulurken randevu kaydı oluşturulamadı",
        error: appointmentError.message,
        code: appointmentError.code,
        detail: appointmentError.detail
      });
    }

    await client.query('COMMIT');
    console.log('Transaction committed successfully. Patient ID:', user.user_id, 'Doctor ID:', doctorId);
    
    // Commit sonrası appointment'ın gerçekten oluşturulduğunu doğrula (yeni connection ile)
    const verifyClient = await db.connect();
    try {
      const verifyAppointment = await verifyClient.query(
        `SELECT appointment_id, doctor_id, patient_id, datetime, type, status 
         FROM appointments 
         WHERE doctor_id = $1 AND patient_id = $2 
         ORDER BY created_at DESC LIMIT 1`,
        [doctorId, user.user_id]
      );
      if (verifyAppointment.rows.length > 0) {
        console.log('✅ Appointment verified after commit:', verifyAppointment.rows[0]);
      } else {
        console.error('❌ WARNING: Appointment not found after commit!');
        console.error('Doctor ID:', doctorId, 'Patient ID:', user.user_id);
      }
    } catch (verifyError) {
      console.error('Error verifying appointment:', verifyError);
    } finally {
      verifyClient.release();
    }
    
    // Hassas bilgileri kaldır
    delete user.password_hash;

    res.status(201).json({ 
      success: true,
      message: "Hasta başarıyla oluşturuldu", 
      data: user,
      appointmentCreated: true
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create patient error:', err);
    res.status(500).json({ 
      success: false,
      error: "Hasta oluşturulurken bir hata oluştu.",
      message: err.message 
    });
  } finally {
    client.release();
  }
};

// Belirli bir hastaya ait tüm tıbbi sonuçları (doktor görünümü için) getir
exports.getMedicalResultsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Hasta ID gereklidir',
      });
    }

    const results = await MedicalResultModel.getResultsByPatientId(patientId);

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (err) {
    console.error('Error fetching medical results for doctor:', err);
    return res.status(500).json({
      success: false,
      message: 'Tıbbi sonuçlar alınırken bir hata oluştu',
    });
  }
};

// Prescription Management
exports.addPrescription = async (req, res) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');

    const {
      patientId,
      patientName,
      doctorName,
      date,
      diagnosis,
      medications,
      instructions,
      status,
      nextVisit,
      appointmentId,
      doctorId
    } = req.body;

    // Validate required fields
    if (!patientId || isNaN(parseInt(patientId))) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing patientId'
      });
    }

    if (!patientName || !diagnosis || !medications || medications.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: patientName, diagnosis and medications are required'
      });
    }

    // Validate medications
    const validMedications = medications.filter(med => med.name && med.dosage);
    if (validMedications.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'At least one valid medication (name and dosage) is required'
      });
    }

    // Create prescription record
    const prescriptionData = {
      appointmentId: appointmentId || null,
      doctorId: doctorId || 1,
      patientId: parseInt(patientId),
      prescriptionCode: `RX-${uuidv4().slice(0, 8).toUpperCase()}`,
      diagnosis: diagnosis.trim(),
      generalInstructions: instructions?.trim() || '',
      usageInstructions: instructions?.trim() || 'Use as directed by your doctor',
      nextVisitDate: nextVisit || null,
      status: status || 'active'
    };

    const prescription = await client.query(
      `INSERT INTO prescriptions (
        appointment_id, doctor_id, patient_id, prescription_code,
        diagnosis, general_instructions, usage_instructions,
        next_visit_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        prescriptionData.appointmentId,
        prescriptionData.doctorId,
        prescriptionData.patientId,
        prescriptionData.prescriptionCode,
        prescriptionData.diagnosis,
        prescriptionData.generalInstructions,
        prescriptionData.usageInstructions,
        prescriptionData.nextVisitDate,
        prescriptionData.status
      ]
    );

    // Add prescription items
    const createdItems = [];
    for (const med of validMedications) {
      const itemData = {
        prescriptionId: prescription.rows[0].prescription_id,
        medicineName: med.name,
        dosage: med.dosage,
        frequency: med.frequency || 'Once daily',
        duration: med.duration || '7 days',
        usageInstructions: med.instructions || 'Take after meals',
        sideEffects: null,
        quantity: 1
      };
      
      const item = await client.query(
        `INSERT INTO prescription_items (
          prescription_id, medicine_name, dosage, frequency, 
          duration, usage_instructions, side_effects, quantity
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          itemData.prescriptionId,
          itemData.medicineName,
          itemData.dosage,
          itemData.frequency,
          itemData.duration,
          itemData.usageInstructions,
          itemData.sideEffects,
          itemData.quantity
        ]
      );
      createdItems.push(item.rows[0]);
    }

    await client.query('COMMIT');

    // Helper function to format dates
    const formatDate = (date) => {
      if (!date) return null;
      return new Date(date).toISOString().split('T')[0];
    };

    // Format response
    const responseData = {
      id: prescription.rows[0].prescription_id,
      patientId: prescription.rows[0].patient_id,
      patientName: patientName,
      doctorName: doctorName || 'Dr. Unknown',
      date: formatDate(prescription.rows[0].created_at) || date || formatDate(new Date()),
      diagnosis: prescription.rows[0].diagnosis,
      medications: createdItems.map(item => ({
        name: item.medicine_name,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        instructions: item.usage_instructions
      })),
      instructions: prescription.rows[0].general_instructions || '',
      status: prescription.rows[0].status || 'active',
      nextVisit: formatDate(prescription.rows[0].next_visit_date)
    };

    // Create notification message
    const notificationData = {
      userId: patientId,
      title: 'Yeni Reçete',
      message: `Dr. ${doctorName || 'Doktorunuz'} size yeni bir reçete yazdı.`,
      type: 'prescription'
    };

    // Save notification to database
    let savedNotification;
    try {
      savedNotification = await NotificationModel.createNotification(notificationData);
    } catch (notifError) {
      console.error('Error saving notification:', notifError);
      // Don't fail the request if notification fails to save, just log it
    }

    // Send real-time notification to the patient
    if (req.io) {
      console.log(`Emitting prescription notification to patient room: ${patientId}`);
      req.io.to(String(patientId)).emit('notification', {
        id: savedNotification ? savedNotification.notification_id : Date.now(),
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        read: false,
        timestamp: savedNotification ? savedNotification.created_at : new Date().toISOString()
      });
    }

    res.status(201).json(responseData);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating prescription',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  } finally {
    client.release();
  }
};

// ... [rest of the prescription management functions remain the same]

exports.getAllPrescriptions = async (req, res) => {
  try {
    const doctorId = req.query.doctorId;
    let queryText = `
      SELECT 
        p.*,
        COALESCE(pat.full_name, 'Bilinmeyen Hasta') as patient_name,
        COALESCE(doc.full_name, 'Dr. Bilinmeyen') as doctor_name
      FROM prescriptions p
      LEFT JOIN users pat ON p.patient_id = pat.user_id AND pat.role = 'patient'
      LEFT JOIN users doc ON p.doctor_id = doc.user_id AND doc.role = 'doctor'
      WHERE 1=1
    `;
    const queryParams = [];
    
    // Doktor ID filtresi
    if (doctorId) {
      queryText += ` AND p.doctor_id = $${queryParams.length + 1}`;
      queryParams.push(doctorId);
    }
    
    // Cancelled reçeteleri hariç tut
    queryText += ` AND (p.status IS NULL OR p.status != 'cancelled')`;
    queryText += ` ORDER BY p.created_at DESC`;
    
    const result = await db.query(queryText, queryParams);
    const prescriptions = result.rows;

    // Tarih formatlama fonksiyonu
    const formatDate = (date) => {
      if (!date) return null;
      try {
        return new Date(date).toISOString().split('T')[0];
      } catch (e) {
        console.error('Tarih formatlama hatası:', e);
        return null;
      }
    };

    // Her reçete için items'ları da getir
    const formattedPrescriptions = [];
    for (const prescription of prescriptions) {
      const items = await db.query('SELECT * FROM prescription_items WHERE prescription_id = $1', [prescription.prescription_id]);
      
      formattedPrescriptions.push({
        id: prescription.prescription_id,
        patientId: prescription.patient_id,
        patientName: prescription.patient_name,
        prescriptionCode: prescription.prescription_code,
        doctorName: prescription.doctor_name,
        date: formatDate(prescription.created_at) || new Date().toISOString().split('T')[0],
        diagnosis: prescription.diagnosis,
        medications: items.rows.map(item => ({
          name: item.medicine_name,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.usage_instructions
        })),
        instructions: prescription.general_instructions || '',
        status: prescription.status || 'active',
        nextVisit: formatDate(prescription.next_visit_date)
      });
    }

    res.status(200).json(formattedPrescriptions);
  } catch (error) {
    console.error('Reçeteler getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Reçeteler yüklenirken hata oluştu'
    });
  }
};
exports.getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Ana reçete bilgisini getir
    const prescription = await db.query('SELECT * FROM prescriptions WHERE prescription_id = $1', [id]);
    if (prescription.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reçete bulunamadı'
      });
    }

    // İlaçları getir
    const items = await db.query('SELECT * FROM prescription_items WHERE prescription_id = $1', [id]);

    // Hasta ve doktor bilgilerini getir
    const query = `
      SELECT 
        p.*,
        COALESCE(pat.full_name, 'Bilinmeyen Hasta') as patient_name,
        COALESCE(doc.full_name, 'Dr. Bilinmeyen') as doctor_name
      FROM prescriptions p
      LEFT JOIN users pat ON p.patient_id = pat.user_id AND pat.role = 'patient'
      LEFT JOIN users doc ON p.doctor_id = doc.user_id AND doc.role = 'doctor'
      WHERE p.prescription_id = $1
    `;
    
    const result = await db.query(query, [id]);
    const fullPrescription = result.rows[0];

    // Frontend formatına dönüştür
    const formattedPrescription = {
      id: prescription.rows[0].prescription_id,
      prescriptionCode: prescription.rows[0].prescription_code, // Bu satırı ekledik
      patientId: prescription.rows[0].patient_id,
      patientName: fullPrescription?.patient_name || 'Bilinmeyen Hasta',
      doctorName: prescription.doctorName,
      date: prescription.rows[0].created_at?.split('T')[0],
      diagnosis: prescription.rows[0].diagnosis,
      medications: items.rows.map(item => ({
        name: item.medicine_name,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        instructions: item.usage_instructions
      })),
      instructions: prescription.rows[0].general_instructions || '',
      status: prescription.rows[0].status,
      nextVisit: prescription.rows[0].next_visit_date
    };

    res.status(200).json(formattedPrescription);
  } catch (error) {
    console.error('Reçete getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Reçete yüklenirken hata oluştu'
    });
  }
};

exports.updatePrescription = async (req, res) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const {
      patientId, // patientId'yi de request body'den al
      patientName,
      diagnosis,
      medications,
      instructions,
      nextVisit,
      status,
      doctorName
    } = req.body;

    // Update main prescription info - patient_id'yi de güncelle
    const updateQuery = `
      UPDATE prescriptions 
      SET patient_id = COALESCE($1, patient_id),
          diagnosis = COALESCE($2, diagnosis),
          general_instructions = COALESCE($3, general_instructions),
          next_visit_date = $4,
          status = COALESCE($5, status),
          updated_at = NOW()
      WHERE prescription_id = $6 
      RETURNING *
    `;
    
    const prescriptionResult = await client.query(updateQuery, [
      patientId, // patient_id'yi güncelle
      diagnosis,
      instructions,
      nextVisit || null,
      status,
      id
    ]);

    if (prescriptionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Reçete bulunamadı'
      });
    }

    // Delete existing items and add new ones
    if (medications && medications.length > 0) {
      await client.query('DELETE FROM prescription_items WHERE prescription_id = $1', [id]);
      
      const validMedications = medications.filter(med => med.name && med.dosage);
      
      for (const med of validMedications) {
        const itemData = {
          prescriptionId: id,
          medicineName: med.name,
          dosage: med.dosage,
          frequency: med.frequency || 'Günde 1 kez',
          duration: med.duration || '7 gün',
          usageInstructions: med.instructions || 'Yemekten sonra alın',
          quantity: 1
        };
        
        await client.query(
          `INSERT INTO prescription_items (
            prescription_id, medicine_name, dosage, frequency, 
            duration, usage_instructions, quantity
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            itemData.prescriptionId,
            itemData.medicineName,
            itemData.dosage,
            itemData.frequency,
            itemData.duration,
            itemData.usageInstructions,
            itemData.quantity
          ]
        );
      }
    }

    await client.query('COMMIT');

    // Get updated items
    const updatedItems = await db.query('SELECT * FROM prescription_items WHERE prescription_id = $1', [id]);
    
    // Date formatting function
    const formatDate = (date) => {
      if (!date) return null;
      try {
        if (typeof date === 'string') {
          return date.split('T')[0];
        } else if (date instanceof Date) {
          return date.toISOString().split('T')[0];
        }
        return null;
      } catch (e) {
        console.error('Tarih formatlama hatası:', e);
        return null;
      }
    };

    // Get patient info from database to ensure we have the correct name
    let patientNameToUse = patientName;
    if (patientId) {
      const patientInfo = await db.query(
        `SELECT full_name FROM users WHERE user_id = $1 AND role = 'patient'`,
        [patientId]
      );
      if (patientInfo.rows.length > 0) {
        patientNameToUse = patientInfo.rows[0].full_name;
      }
    }

    // Get doctor info
    let doctorNameToUse = doctorName;
    if (!doctorNameToUse) {
      const doctorInfo = await db.query(
        `SELECT u.full_name 
         FROM users u
         JOIN prescriptions p ON u.user_id = p.doctor_id
         WHERE p.prescription_id = $1`,
        [id]
      );
      doctorNameToUse = doctorInfo.rows[0]?.full_name || 'Dr. Bilinmeyen';
    }

    const responseData = {
      id: prescriptionResult.rows[0].prescription_id,
      patientId: prescriptionResult.rows[0].patient_id,
      patientName: patientNameToUse, // Database'den gelen doğru hasta adını kullan
      prescriptionCode: prescriptionResult.rows[0].prescription_code,
      doctorName: doctorNameToUse,
      date: formatDate(prescriptionResult.rows[0].created_at),
      diagnosis: prescriptionResult.rows[0].diagnosis,
      medications: updatedItems.rows.map(item => ({
        name: item.medicine_name,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        instructions: item.usage_instructions
      })),
      instructions: prescriptionResult.rows[0].general_instructions || '',
      status: prescriptionResult.rows[0].status,
      nextVisit: formatDate(prescriptionResult.rows[0].next_visit_date)
    };

    res.status(200).json(responseData);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Reçete güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Reçete güncellenirken hata oluştu'
    });
  } finally {
    client.release();
  }
};
exports.deletePrescription = async (req, res) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;

    // Önce items'ları sil
    await client.query('DELETE FROM prescription_items WHERE prescription_id = $1', [id]);
    
    // Sonra ana reçeteyi sil
    const result = await client.query('DELETE FROM prescriptions WHERE prescription_id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Reçete bulunamadı'
      });
    }

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'Reçete başarıyla silindi'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Reçete silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Reçete silinirken hata oluştu'
    });
  } finally {
    client.release();
  }
};

exports.getPatientPrescriptions = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const prescriptions = await db.query('SELECT * FROM prescriptions WHERE patient_id = $1 ORDER BY created_at DESC', [patientId]);
    
    // Her reçete için items'ları da getir
    const formattedPrescriptions = [];
    for (const prescription of prescriptions.rows) {
      const items = await db.query('SELECT * FROM prescription_items WHERE prescription_id = $1', [prescription.prescription_id]);
      
      formattedPrescriptions.push({
        id: prescription.prescription_id,
        patientId: prescription.patient_id,
        date: prescription.created_at?.split('T')[0],
        diagnosis: prescription.diagnosis,
        medications: items.rows.map(item => ({
          name: item.medicine_name,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.usage_instructions
        })),
        instructions: prescription.general_instructions || '',
        status: prescription.status,
        nextVisit: prescription.next_visit_date
      });
    }
    
    res.status(200).json(formattedPrescriptions);
  } catch (error) {
    console.error('Hasta reçeteleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Hasta reçeteleri yüklenirken hata oluştu'
    });
  }
};

exports.updatePrescriptionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz durum değeri'
      });
    }

    const updatedPrescription = await db.query(
      'UPDATE prescriptions SET status = $1 WHERE prescription_id = $2 RETURNING *',
      [status, id]
    );

    if (updatedPrescription.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reçete bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reçete durumu güncellendi',
      data: updatedPrescription.rows[0]
    });
  } catch (error) {
    console.error('Reçete durum güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Reçete durumu güncellenirken hata oluştu'
    });
  }
};

// ==================== RAPOR YÖNETİMİ ====================

// Yeni rapor oluştur
exports.addReport = async (req, res) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');

    const {
      patientId,
      patientName,
      patientGender,
      patientAge,
      doctorName,
      startDate,
      endDate,
      diagnosis,
      diagnosisDetails,
      medications,
      status,
      doctorId
    } = req.body;

    // Zorunlu alanları kontrol et
    if (!patientId || isNaN(parseInt(patientId))) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veya eksik patientId'
      });
    }

    if (!diagnosis || !startDate || !endDate) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Eksik zorunlu alanlar: diagnosis, startDate ve endDate gereklidir'
      });
    }

    // Tarih kontrolü
    if (new Date(endDate) < new Date(startDate)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Bitiş tarihi başlangıç tarihinden önce olamaz'
      });
    }

    // Rapor kodu oluştur
    const reportCode = `RPT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    // Raporu veritabanına ekle
    const reportResult = await client.query(
      `INSERT INTO medical_report (
        doctor_id, patient_id, report_start_date, report_end_date,
        diagnosis, diagnosis_details, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        doctorId || req.user?.user_id || 1,
        parseInt(patientId),
        startDate,
        endDate,
        diagnosis.trim(),
        diagnosisDetails?.trim() || null,
        status || 'active'
      ]
    );

    const createdReport = reportResult.rows[0];

    // İlaçları ekle (varsa)
    const createdMedications = [];
    if (medications && medications.length > 0) {
      const validMedications = medications.filter(med => med.name && med.name.trim());
      
      for (const med of validMedications) {
        const medResult = await client.query(
          `INSERT INTO report_medications (
            report_id, medicine_name, dosage, frequency, duration, usage_instructions
          ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [
            createdReport.report_id,
            med.name.trim(),
            med.dosage?.trim() || '',
            med.frequency?.trim() || null,
            med.duration?.trim() || null,
            med.instructions?.trim() || null
          ]
        );
        createdMedications.push(medResult.rows[0]);
      }
    }

    await client.query('COMMIT');

    // Tarih formatlama fonksiyonu
    const formatDate = (date) => {
      if (!date) return null;
      return new Date(date).toISOString().split('T')[0];
    };

    // Response formatı
    const responseData = {
      id: createdReport.report_id,
      reportCode: reportCode,
      patientId: createdReport.patient_id,
      patientName: patientName,
      patientGender: patientGender,
      patientAge: patientAge,
      doctorId: createdReport.doctor_id,
      doctorName: doctorName || 'Dr. Bilinmiyor',
      startDate: formatDate(createdReport.report_start_date),
      endDate: formatDate(createdReport.report_end_date),
      diagnosis: createdReport.diagnosis,
      diagnosisDetails: createdReport.diagnosis_details || '',
      medications: createdMedications.map(med => ({
        name: med.medicine_name,
        dosage: med.dosage,
        frequency: med.frequency || '',
        duration: med.duration || '',
        instructions: med.usage_instructions || ''
      })),
      status: createdReport.status || 'active',
      createdAt: createdReport.created_at
    };

    // Hastaya bildirim gönder
    const notificationData = {
      userId: patientId,
      title: 'Yeni Rapor',
      message: `Dr. ${doctorName || 'Doktorunuz'} size yeni bir rapor oluşturdu.`,
      type: 'report'
    };

    try {
      await NotificationModel.createNotification(notificationData);
      
      if (req.io) {
        req.io.to(String(patientId)).emit('notification', {
          id: Date.now(),
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          read: false,
          timestamp: new Date().toISOString()
        });
      }
    } catch (notifError) {
      console.error('Bildirim gönderme hatası:', notifError);
    }

    res.status(201).json(responseData);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Rapor oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Rapor oluşturulurken hata oluştu',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  } finally {
    client.release();
  }
};

// Tüm raporları getir
exports.getAllReports = async (req, res) => {
  try {
    const doctorId = req.query.doctorId;
    
    let queryText = `
      SELECT 
        r.*,
        COALESCE(pat.full_name, 'Bilinmeyen Hasta') as patient_name,
        COALESCE(pp.gender, 'Belirtilmemiş') as patient_gender,
        CASE 
          WHEN pp.birth_date IS NOT NULL THEN
            FLOOR(EXTRACT(YEAR FROM age(current_date, pp.birth_date)))
          ELSE 0
        END as patient_age,
        COALESCE(doc.full_name, 'Dr. Bilinmeyen') as doctor_name
      FROM medical_report r
      LEFT JOIN users pat ON r.patient_id = pat.user_id AND pat.role = 'patient'
      LEFT JOIN patient_profiles pp ON r.patient_id = pp.user_id
      LEFT JOIN users doc ON r.doctor_id = doc.user_id AND doc.role = 'doctor'
      WHERE 1=1
    `;
    const queryParams = [];
    
    if (doctorId) {
      queryText += ` AND r.doctor_id = $${queryParams.length + 1}`;
      queryParams.push(doctorId);
    }
    
    queryText += ` AND (r.status IS NULL OR r.status != 'cancelled')`;
    queryText += ` ORDER BY r.created_at DESC`;
    
    const result = await db.query(queryText, queryParams);
    const reports = result.rows;

    // Tarih formatlama fonksiyonu
    const formatDate = (date) => {
      if (!date) return null;
      try {
        return new Date(date).toISOString().split('T')[0];
      } catch (e) {
        return null;
      }
    };

    // Cinsiyet dönüştürme
    const formatGender = (gender) => {
      if (!gender) return 'Belirtilmemiş';
      switch(gender.toLowerCase()) {
        case 'male': return 'Erkek';
        case 'female': return 'Kadın';
        case 'other': return 'Diğer';
        default: return gender;
      }
    };

    // Her rapor için ilaçları da getir
    const formattedReports = [];
    for (const report of reports) {
      const medications = await db.query(
        'SELECT * FROM report_medications WHERE report_id = $1',
        [report.report_id]
      );
      
      formattedReports.push({
        id: report.report_id,
        reportCode: `RPT-${report.report_id}`,
        patientId: report.patient_id,
        patientName: report.patient_name,
        patientGender: formatGender(report.patient_gender),
        patientAge: parseInt(report.patient_age) || 0,
        doctorId: report.doctor_id,
        doctorName: report.doctor_name,
        startDate: formatDate(report.report_start_date),
        endDate: formatDate(report.report_end_date),
        diagnosis: report.diagnosis,
        diagnosisDetails: report.diagnosis_details || '',
        medications: medications.rows.map(med => ({
          name: med.medicine_name,
          dosage: med.dosage,
          frequency: med.frequency || '',
          duration: med.duration || '',
          instructions: med.usage_instructions || ''
        })),
        status: report.status || 'active',
        createdAt: report.created_at
      });
    }

    res.status(200).json(formattedReports);
  } catch (error) {
    console.error('Raporlar getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Raporlar yüklenirken hata oluştu'
    });
  }
};

// Belirli bir raporu getir
exports.getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const queryText = `
      SELECT 
        r.*,
        COALESCE(pat.full_name, 'Bilinmeyen Hasta') as patient_name,
        COALESCE(pp.gender, 'Belirtilmemiş') as patient_gender,
        CASE 
          WHEN pp.birth_date IS NOT NULL THEN
            FLOOR(EXTRACT(YEAR FROM age(current_date, pp.birth_date)))
          ELSE 0
        END as patient_age,
        COALESCE(doc.full_name, 'Dr. Bilinmeyen') as doctor_name
      FROM medical_report r
      LEFT JOIN users pat ON r.patient_id = pat.user_id AND pat.role = 'patient'
      LEFT JOIN patient_profiles pp ON r.patient_id = pp.user_id
      LEFT JOIN users doc ON r.doctor_id = doc.user_id AND doc.role = 'doctor'
      WHERE r.report_id = $1
    `;
    
    const result = await db.query(queryText, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rapor bulunamadı'
      });
    }

    const report = result.rows[0];
    const medications = await db.query(
      'SELECT * FROM report_medications WHERE report_id = $1',
      [id]
    );

    // Tarih formatlama fonksiyonu
    const formatDate = (date) => {
      if (!date) return null;
      try {
        return new Date(date).toISOString().split('T')[0];
      } catch (e) {
        return null;
      }
    };

    // Cinsiyet dönüştürme
    const formatGender = (gender) => {
      if (!gender) return 'Belirtilmemiş';
      switch(gender.toLowerCase()) {
        case 'male': return 'Erkek';
        case 'female': return 'Kadın';
        case 'other': return 'Diğer';
        default: return gender;
      }
    };

    const formattedReport = {
      id: report.report_id,
      reportCode: `RPT-${report.report_id}`,
      patientId: report.patient_id,
      patientName: report.patient_name,
      patientGender: formatGender(report.patient_gender),
      patientAge: parseInt(report.patient_age) || 0,
      doctorId: report.doctor_id,
      doctorName: report.doctor_name,
      startDate: formatDate(report.report_start_date),
      endDate: formatDate(report.report_end_date),
      diagnosis: report.diagnosis,
      diagnosisDetails: report.diagnosis_details || '',
      medications: medications.rows.map(med => ({
        name: med.medicine_name,
        dosage: med.dosage,
        frequency: med.frequency || '',
        duration: med.duration || '',
        instructions: med.usage_instructions || ''
      })),
      status: report.status || 'active',
      createdAt: report.created_at
    };

    res.status(200).json(formattedReport);
  } catch (error) {
    console.error('Rapor getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Rapor yüklenirken hata oluştu'
    });
  }
};

// Rapor güncelle
exports.updateReport = async (req, res) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const {
      patientId,
      patientName,
      patientGender,
      patientAge,
      startDate,
      endDate,
      diagnosis,
      diagnosisDetails,
      medications,
      status,
      doctorName
    } = req.body;

    // Tarih kontrolü
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Bitiş tarihi başlangıç tarihinden önce olamaz'
      });
    }

    // Raporu güncelle
    const updateQuery = `
      UPDATE medical_report 
      SET patient_id = COALESCE($1, patient_id),
          report_start_date = COALESCE($2, report_start_date),
          report_end_date = COALESCE($3, report_end_date),
          diagnosis = COALESCE($4, diagnosis),
          diagnosis_details = COALESCE($5, diagnosis_details),
          status = COALESCE($6, status),
          updated_at = NOW()
      WHERE report_id = $7 
      RETURNING *
    `;
    
    const reportResult = await client.query(updateQuery, [
      patientId,
      startDate,
      endDate,
      diagnosis,
      diagnosisDetails,
      status,
      id
    ]);

    if (reportResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Rapor bulunamadı'
      });
    }

    // Mevcut ilaçları sil ve yenilerini ekle
    if (medications && medications.length > 0) {
      await client.query('DELETE FROM report_medications WHERE report_id = $1', [id]);
      
      const validMedications = medications.filter(med => med.name && med.name.trim());
      
      for (const med of validMedications) {
        await client.query(
          `INSERT INTO report_medications (
            report_id, medicine_name, dosage, frequency, duration, usage_instructions
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            id,
            med.name.trim(),
            med.dosage?.trim() || '',
            med.frequency?.trim() || null,
            med.duration?.trim() || null,
            med.instructions?.trim() || null
          ]
        );
      }
    }

    await client.query('COMMIT');

    // Güncellenmiş ilaçları getir
    const updatedMedications = await db.query(
      'SELECT * FROM report_medications WHERE report_id = $1',
      [id]
    );
    
    // Tarih formatlama fonksiyonu
    const formatDate = (date) => {
      if (!date) return null;
      try {
        if (typeof date === 'string') {
          return date.split('T')[0];
        } else if (date instanceof Date) {
          return date.toISOString().split('T')[0];
        }
        return null;
      } catch (e) {
        return null;
      }
    };

    // Hasta bilgilerini al
    let patientNameToUse = patientName;
    let patientGenderToUse = patientGender;
    let patientAgeToUse = patientAge;
    
    if (patientId) {
      const patientInfo = await db.query(
        `SELECT u.full_name, pp.gender, pp.birth_date
         FROM users u
         LEFT JOIN patient_profiles pp ON u.user_id = pp.user_id
         WHERE u.user_id = $1 AND u.role = 'patient'`,
        [patientId]
      );
      if (patientInfo.rows.length > 0) {
        patientNameToUse = patientInfo.rows[0].full_name;
        const gender = patientInfo.rows[0].gender;
        patientGenderToUse = gender === 'male' ? 'Erkek' : gender === 'female' ? 'Kadın' : 'Diğer';
        if (patientInfo.rows[0].birth_date) {
          const birthDate = new Date(patientInfo.rows[0].birth_date);
          patientAgeToUse = Math.floor((new Date() - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
        }
      }
    }

    const updatedReport = reportResult.rows[0];
    
    const responseData = {
      id: updatedReport.report_id,
      reportCode: `RPT-${updatedReport.report_id}`,
      patientId: updatedReport.patient_id,
      patientName: patientNameToUse,
      patientGender: patientGenderToUse,
      patientAge: patientAgeToUse,
      doctorId: updatedReport.doctor_id,
      doctorName: doctorName || 'Dr. Bilinmiyor',
      startDate: formatDate(updatedReport.report_start_date),
      endDate: formatDate(updatedReport.report_end_date),
      diagnosis: updatedReport.diagnosis,
      diagnosisDetails: updatedReport.diagnosis_details || '',
      medications: updatedMedications.rows.map(med => ({
        name: med.medicine_name,
        dosage: med.dosage,
        frequency: med.frequency || '',
        duration: med.duration || '',
        instructions: med.usage_instructions || ''
      })),
      status: updatedReport.status,
      createdAt: updatedReport.created_at
    };

    res.status(200).json(responseData);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Rapor güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Rapor güncellenirken hata oluştu'
    });
  } finally {
    client.release();
  }
};

// Rapor sil
exports.deleteReport = async (req, res) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;

    // Önce ilaçları sil
    await client.query('DELETE FROM report_medications WHERE report_id = $1', [id]);
    
    // Sonra raporu sil
    const result = await client.query(
      'DELETE FROM medical_report WHERE report_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Rapor bulunamadı'
      });
    }

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'Rapor başarıyla silindi'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Rapor silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Rapor silinirken hata oluştu'
    });
  } finally {
    client.release();
  }
};

// Rapor durumunu güncelle
exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz durum değeri'
      });
    }

    const updatedReport = await db.query(
      'UPDATE medical_report SET status = $1, updated_at = NOW() WHERE report_id = $2 RETURNING *',
      [status, id]
    );

    if (updatedReport.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rapor bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Rapor durumu güncellendi',
      data: updatedReport.rows[0]
    });
  } catch (error) {
    console.error('Rapor durum güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Rapor durumu güncellenirken hata oluştu'
    });
  }
};

// Hastaya ait raporları getir
exports.getPatientReports = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const queryText = `
      SELECT 
        r.*,
        COALESCE(doc.full_name, 'Dr. Bilinmeyen') as doctor_name
      FROM medical_report r
      LEFT JOIN users doc ON r.doctor_id = doc.user_id AND doc.role = 'doctor'
      WHERE r.patient_id = $1
      ORDER BY r.created_at DESC
    `;
    
    const result = await db.query(queryText, [patientId]);
    
    // Tarih formatlama fonksiyonu
    const formatDate = (date) => {
      if (!date) return null;
      try {
        return new Date(date).toISOString().split('T')[0];
      } catch (e) {
        return null;
      }
    };

    // Her rapor için ilaçları da getir
    const formattedReports = [];
    for (const report of result.rows) {
      const medications = await db.query(
        'SELECT * FROM report_medications WHERE report_id = $1',
        [report.report_id]
      );
      
      formattedReports.push({
        id: report.report_id,
        reportCode: `RPT-${report.report_id}`,
        doctorName: report.doctor_name,
        startDate: formatDate(report.report_start_date),
        endDate: formatDate(report.report_end_date),
        diagnosis: report.diagnosis,
        diagnosisDetails: report.diagnosis_details || '',
        medications: medications.rows.map(med => ({
          name: med.medicine_name,
          dosage: med.dosage,
          frequency: med.frequency || '',
          duration: med.duration || '',
          instructions: med.usage_instructions || ''
        })),
        status: report.status || 'active',
        createdAt: report.created_at
      });
    }
    
    res.status(200).json(formattedReports);
  } catch (error) {
    console.error('Hasta raporları getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Hasta raporları yüklenirken hata oluştu'
    });
  }
};