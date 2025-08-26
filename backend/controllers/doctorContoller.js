const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { sendAppointmentConfirmation } = require('../services/mailService');

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
    console.error('Error getting active appointments:', err);
    res.status(500).json({ message: 'Failed to get active appointments' });
  }
};

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
          u.full_name AS patient_name,  // patientname yerine patient_name
          pp.birth_date,
          CASE 
            WHEN pp.birth_date IS NOT NULL THEN
              (EXTRACT(YEAR FROM age(current_date, pp.birth_date)) * 12 +
               EXTRACT(MONTH FROM age(current_date, pp.birth_date))) / 12
            ELSE 0
          END as patient_age,  // patientage yerine patient_age
          a.datetime,
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
    
    console.log('Raw SQL result:', result.rows);

    // Format the response data
    const formattedAppointments = result.rows.map(appointment => {
      console.log('Processing appointment:', appointment);
      return {
        appointment_id: appointment.appointment_id,
        patient_id: appointment.patient_id,
        patientName: appointment.patient_name || 'İsimsiz Hasta',  // patient_name kullan
        patientAge: appointment.patient_age || 0,  // patient_age kullan
        datetime: appointment.datetime,
        type: appointment.type,
        status: appointment.status,
        specialty: appointment.specialty
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
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Randevu, hasta ve doktor bilgilerini al
    const appointmentResult = await query(
      `SELECT 
        a.*,
        u.email AS patient_email,
        u.full_name AS patient_name,
        d.full_name AS doctor_name,
        dp.specialty AS doctor_specialty
      FROM appointments a
      JOIN users u ON a.patient_id = u.user_id
      JOIN users d ON a.doctor_id = d.user_id
      JOIN doctor_profiles dp ON a.doctor_id = dp.user_id
      WHERE a.appointment_id = $1`,
      [appointmentId]
    );

    if (appointmentResult.rowCount === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const result = await query(
      `UPDATE appointments 
       SET status = $1, updated_at = NOW() 
       WHERE appointment_id = $2 
       RETURNING *`,
      [status, appointmentId]
    );

    // Mail servisi modülünü import et
    const { sendAppointmentConfirmation, sendAppointmentRejection } = require('../services/mailService');

    // Randevu durumuna göre mail gönder
    const appointmentData = appointmentResult.rows[0];
    const { patient_email, doctor_name, doctor_specialty, datetime, type } = appointmentData;
    
    if (status === 'confirmed') {
      const appointmentDetails = {
        doctorName: doctor_name,
        doctorSpecialty: doctor_specialty,
        date: new Date(datetime).toLocaleDateString('tr-TR'),
        time: new Date(datetime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        location: 'MedLine Hastanesi',
        appointmentType: type
      };
      
      await sendAppointmentConfirmation(patient_email, appointmentDetails);
    } else if (status === 'cancelled') {
      const appointmentDetails = {
        doctorName: doctor_name,
        doctorSpecialty: doctor_specialty,
        date: new Date(datetime).toLocaleDateString('tr-TR'),
        time: new Date(datetime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        reason: req.body.reason // Eğer red sebebi gönderilmişse
      };
      
      await sendAppointmentRejection(patient_email, appointmentDetails);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating appointment status:', err);
    res.status(500).json({ message: 'Failed to update appointment status' });
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
          u.full_name,  
          pp.birth_date,
          CASE 
            WHEN pp.birth_date IS NOT NULL THEN
              (EXTRACT(YEAR FROM age(current_date, pp.birth_date)) * 12 +
               EXTRACT(MONTH FROM age(current_date, pp.birth_date))) / 12
            ELSE 0
          END as calculated_age,
          a.datetime,
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
    
    console.log('Raw SQL result:', result.rows);

    // Format the response data - frontend'in beklediği isimlere dönüştür
    const formattedAppointments = result.rows.map(appointment => {
      console.log('Processing appointment:', appointment);
      return {
        appointment_id: appointment.appointment_id,
        patient_id: appointment.patient_id,
        patientname: appointment.full_name || 'İsimsiz Hasta',  // full_name'i patientname olarak
        patientage: appointment.calculated_age || 0,           // calculated_age'i patientage olarak
        datetime: appointment.datetime,
        type: appointment.type,
        status: appointment.status,
        specialty: appointment.specialty
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
    const result = await query(
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
       GROUP BY u.user_id, u.full_name, u.email, u.phone_number, 
                p.birth_date, p.gender, p.address, p.medical_history, a.doctor_id`,
      [doctorId]
    );
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
    const query = `
      SELECT 
        p.*,
        COALESCE(pat.full_name, 'Bilinmeyen Hasta') as patient_name,
        COALESCE(doc.full_name, 'Dr. Bilinmeyen') as doctor_name
      FROM prescriptions p
      LEFT JOIN users pat ON p.patient_id = pat.user_id AND pat.role = 'patient'
      LEFT JOIN users doc ON p.doctor_id = doc.user_id AND doc.role = 'doctor'
      ORDER BY p.created_at DESC
    `;
    
    const result = await db.query(query);
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