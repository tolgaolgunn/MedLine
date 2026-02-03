const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { createUser, getUserByEmail, getUserByNationalId } = require("../models/userModel");
const { 
  createDoctorProfile, 
  getAllDoctorsWithUser,
  getDoctorProfileByUserId,
  deleteDoctor
} = require("../models/doctorProfileModel");
const { getAllFeedbacks, getFeedbackById, respondToFeedback } = require("../models/feedbackModel");
const { getAllAppointmentsWithDetails, getAppointmentById } = require("../models/appointmentModel");
const { getAllPrescriptionsWithDetails, getPrescriptionById } = require("../models/prescriptionAdminModel");
const { getAllPatients, getPatientProfileByUserId, createPatientProfile, updatePatientProfile, deletePatient } = require("../models/patientProfileModel");
const NotificationModel = require("../models/notificationModel");

// ... imports ...

// Geri bildirime cevap verme endpoint'i
exports.createPatient = async (req, res) => {
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

  try {
    // E-posta kontrolü
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Bu e-posta ile kayıtlı kullanıcı zaten var." });
    }

    // TC Kimlik kontrolü
    if (national_id) {
      const existingNationalId = await getUserByNationalId(national_id);
      if (existingNationalId) {
        return res.status(400).json({ message: "Bu TC Kimlik numarası ile kayıtlı kullanıcı zaten var." });
      }
    }

    // Zorunlu alanların kontrolü
    if (!full_name || !email || !password) {
      return res.status(400).json({ message: "Ad-soyad, e-posta ve şifre alanları zorunludur." });
    }

    // Şifre hash'leme
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Kullanıcı oluşturma (role her zaman "patient")
    const user = await createUser(
      full_name, 
      email, 
      password_hash, 
      phone_number, 
      "patient", 
      true, // is_approved
      national_id
    );
    
    // Hasta profili oluşturma
    await createPatientProfile(
      user.user_id,
      birth_date || null,
      gender || null,
      address || null,
      medical_history || null,
      blood_type || null
    );

    // Hassas bilgileri kaldır
    delete user.password_hash;

    res.status(201).json({ 
      message: "Hasta başarıyla oluşturuldu", 
      user: user
    });
  } catch (err) {
    console.error('Create patient error:', err);
    res.status(500).json({ error: "Hasta oluşturulurken bir hata oluştu." });
  }
};

exports.createDoctor = async (req, res) => {
  const { 
    full_name, 
    email, 
    password, 
    phone_number, 
    specialty, 
    license_number, 
    experience_years, 
    biography, 
    city, 
    district, 
    hospital_name 
  } = req.body;

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // E-posta kontrolü
    const emailCheck = await client.query(
      "SELECT COUNT(*) FROM users WHERE email = $1",
      [email]
    );
    
    if (parseInt(emailCheck.rows[0].count) > 0) {
      throw {
        code: '23505',
        constraint: 'users_email_key',
        message: 'Bu e-posta adresi zaten kullanımda.'
      };
    }

    // Lisans numarası kontrolü
    const licenseCheck = await client.query(
      "SELECT COUNT(*) FROM doctor_profiles WHERE license_number = $1",
      [license_number]
    );
    
    if (parseInt(licenseCheck.rows[0].count) > 0) {
      throw {
        code: '23505',
        constraint: 'doctor_profiles_license_number_key',
        message: 'Bu lisans numarası zaten kullanımda.'
      };
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user with doctor role
    const userResult = await client.query(
      "INSERT INTO users (full_name, email, password_hash, phone_number, role, is_approved) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [full_name, email, password_hash, phone_number, "doctor", true]
    );

    if (!userResult.rows[0]) {
      throw new Error('Kullanıcı oluşturulamadı');
    }

    const user = userResult.rows[0];

    // Create doctor profile
    const doctorResult = await client.query(
      `INSERT INTO doctor_profiles (user_id, specialty, license_number, experience_years, biography, city, district, hospital_name, approved_by_admin)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [user.user_id, specialty, license_number, experience_years || 0, biography || null, city, district, hospital_name, true]
    );

    if (!doctorResult.rows[0]) {
      throw new Error('Doktor profili oluşturulamadı');
    }

    const doctorProfile = doctorResult.rows[0];

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Doktor başarıyla oluşturuldu',
      data: {
        user,
        doctorProfile
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating doctor:', error);

    if (error.code === '23505') {
      if (error.constraint === 'users_email_key') {
        return res.status(400).json({
          message: 'Bu e-posta adresi zaten kullanımda.',
          code: error.code,
          constraint: error.constraint
        });
      } else if (error.constraint === 'doctor_profiles_license_number_key') {
        return res.status(400).json({
          message: 'Bu lisans numarası zaten kullanımda.',
          code: error.code,
          constraint: error.constraint
        });
      }
    }

    if (error.code === '23503') {
      return res.status(400).json({
        message: 'Geçersiz kullanıcı ID',
        error: error.message,
        code: error.code,
        constraint: error.constraint
      });
    }

    res.status(400).json({
      message: 'Doktor oluşturulurken bir hata oluştu',
      error: error.message,
      code: error.code,
      constraint: error.constraint
    });
  } finally {
    client.release();
  }
};

// Get all doctors with their profiles
exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await getAllDoctorsWithUser();
    res.status(200).json({
      success: true,
      data: doctors,
      message: "Doktorlar başarıyla getirildi"
    });
  } catch (err) {
    console.error('Error fetching doctors:', err);
    res.status(500).json({ 
      success: false, 
      message: "Doktorlar getirilirken bir hata oluştu",
      error: err.message 
    });
  }
};

// Tüm hastaları listeleyen endpoint
exports.getAllPatients = async (req, res) => {
  try {
    const patients = await getAllPatients('patient');
    
    res.status(200).json({
      success: true,
      data: patients,
      message: "Hastalar başarıyla getirildi"
    });
  } catch (err) {
    console.error('Error fetching patients:', err);
    res.status(500).json({
      success: false,
      message: "Hastalar getirilirken bir hata oluştu",
      error: err.message
    });
  }
};

// Tüm feedbackleri listeleyen endpoint
exports.getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await getAllFeedbacks();
    console.log('Sending feedbacks:', feedbacks); // Debug log
    res.status(200).json(feedbacks);
  } catch (err) {
    console.error('Error fetching feedbacks:', err);
    res.status(500).json({ error: "Geri bildirimler getirilirken bir hata oluştu" });
  }
};

// Tüm randevuları detaylı bir şekilde listeleyen endpoint
exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await getAllAppointmentsWithDetails();
    
    res.status(200).json({
      success: true,
      data: appointments,
      message: "Randevular başarıyla getirildi"
    });
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({
      success: false,
      message: "Randevular getirilirken bir hata oluştu",
      error: err.message
    });
  }
};

// Reçete güncelleme endpoint'i
exports.updatePrescription = async (req, res) => {
  try {
    const prescriptionId = req.params.id;
    const updateData = req.body;
    
    const updatedPrescription = await updatePrescription(prescriptionId, updateData);

    if (!updatedPrescription) {
      return res.status(404).json({
        success: false,
        message: "Güncellenecek reçete bulunamadı"
      });
    }

    res.status(200).json({
      success: true,
      data: updatedPrescription,
      message: "Reçete başarıyla güncellendi"
    });
  } catch (err) {
    console.error('Error updating prescription:', err);
    res.status(500).json({
      success: false,
      message: "Reçete güncellenirken bir hata oluştu",
      error: err.message
    });
  }
};

// Reçete silme endpoint'i
exports.deletePrescription = async (req, res) => {
  try {
    const prescriptionId = req.params.id;
    const deletedPrescription = await deletePrescription(prescriptionId);

    if (!deletedPrescription) {
      return res.status(404).json({
        success: false,
        message: "Silinecek reçete bulunamadı"
      });
    }

    res.status(200).json({
      success: true,
      message: "Reçete başarıyla silindi"
    });
  } catch (err) {
    console.error('Error deleting prescription:', err);
    res.status(500).json({
      success: false,
      message: "Reçete silinirken bir hata oluştu",
      error: err.message
    });
  }
};

// Tüm reçeteleri detaylı bir şekilde listeleyen endpoint
exports.getAllPrescriptions = async (req, res) => {
  try {
    const prescriptions = await getAllPrescriptionsWithDetails();
    
    res.status(200).json({
      success: true,
      data: prescriptions,
      message: "Reçeteler başarıyla getirildi"
    });
  } catch (err) {
    console.error('Error fetching prescriptions:', err);
    res.status(500).json({
      success: false,
      message: "Reçeteler getirilirken bir hata oluştu",
      error: err.message
    });
  }
};

// ID'ye göre hasta bilgilerini getiren endpoint
exports.getPatientById = async (req, res) => {
  try {
    const patientId = req.params.id;
    const patient = await getPatientProfileByUserId(patientId);

    console.log('Retrieved patient data:', patient); // Debug log

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Hasta bulunamadı"
      });
    }

    // Hasta verilerini direkt olarak gönder
    res.status(200).json({
      success: true,
      data: patient,
      message: "Hasta bilgileri başarıyla getirildi"
    });
  } catch (err) {
    console.error('Error fetching patient:', err);
    res.status(500).json({
      success: false,
      message: "Hasta bilgileri getirilirken bir hata oluştu",
      error: err.message
    });
  }
};

// Hasta bilgilerini güncelleme endpoint'i
exports.updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      full_name, 
      email, 
      phone_number, 
      birth_date, 
      gender, 
      address, 
      blood_type,
      health_history 
    } = req.body;

    // Önce user tablosunu güncelle
    const updatedUser = await updateUserProfile(id, { 
      full_name, 
      email, 
      phone_number 
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "Güncellenecek hasta bulunamadı"
      });
    }

    // Sonra hasta profilini güncelle
    await updatePatientProfile(id, {
      birth_date,
      gender,
      address,
      blood_type,
      medical_history: health_history
    });

    res.json({ 
      success: true,
      message: "Hasta bilgileri başarıyla güncellendi",
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ 
      success: false,
      message: "Hasta güncellenirken bir hata oluştu",
      error: error.message
    });
  }
};

// Hasta silme endpoint'i
exports.deletePatient = async (req, res) => {
  try {
    const patientId = req.params.id;
    const deletedPatient = await deletePatient(patientId);

    if (!deletedPatient) {
      return res.status(404).json({
        success: false,
        message: "Silinecek hasta bulunamadı"
      });
    }

    res.status(200).json({
      success: true,
      message: "Hasta başarıyla silindi"
    });
  } catch (err) {
    console.error('Error deleting patient:', err);
    res.status(500).json({
      success: false,
      message: "Hasta silinirken bir hata oluştu",
      error: err.message
    });
  }
};

const { updateDoctorProfile } = require('../models/doctorProfileModel');
const { updateUserProfile } = require('../models/userModel');

// Doktor bilgilerini güncelleme endpoint'i
exports.updateDoctor = async (req, res) => {
  try {
    const doctorId = req.params.id;
    console.log('Update Doctor Request Body:', req.body);
    
    // Map frontend field names to backend field names
    const {
      name,          // Frontend field
      email,
      phoneNumber,   // Frontend field
      specialization,// Frontend field
      license_number,
      experience_years,
      biography,
      city,
      district,
      hospital_name
    } = req.body;

    const full_name = name;
    const phone_number = phoneNumber;
    const specialty = specialization;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "İsim alanı boş bırakılamaz"
      });
    }

    // User tablosundaki bilgileri güncelle
    const userUpdateData = {
      full_name: name,
      email,
      phone_number: phoneNumber
    };
    
    const updatedUser = await updateUserProfile(doctorId, userUpdateData);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "Güncellenecek kullanıcı bulunamadı"
      });
    }

    // Doctor profile tablosundaki bilgileri güncelle
    const doctorUpdateData = {
      specialty: specialization,
      license_number,
      experience_years,
      biography,
      city,
      district,
      hospital_name
    };

    const updatedDoctor = await updateDoctorProfile(doctorId, doctorUpdateData);

    if (!updatedDoctor) {
      return res.status(404).json({
        success: false,
        message: "Güncellenecek doktor profili bulunamadı"
      });
    }

    // Birleştirilmiş güncel veriyi döndür
    const updatedData = {
      ...updatedUser,
      ...updatedDoctor
    };

    res.status(200).json({
      success: true,
      data: updatedData,
      message: "Doktor bilgileri başarıyla güncellendi"
    });
  } catch (err) {
    console.error('Error updating doctor:', err);
    res.status(500).json({
      success: false,
      message: "Doktor bilgileri güncellenirken bir hata oluştu",
      error: err.message
    });
  }
};

// Geri bildirime cevap verme endpoint'i
// Geri bildirime cevap verme endpoint'i
exports.respondToFeedback = async (req, res) => {
  try {
    const feedbackId = req.params.id;
    const { adminResponse } = req.body;

    if (!adminResponse || adminResponse.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Cevap metni boş olamaz"
      });
    }

    // Get the feedback details to find the user_id
    const feedback = await getFeedbackById(feedbackId);
    if (!feedback) {
        return res.status(404).json({
            success: false,
            message: "Geri bildirim bulunamadı"
        });
    }

    const updatedFeedback = await respondToFeedback(feedbackId, adminResponse);

    if (!updatedFeedback) {
      return res.status(404).json({
        success: false,
        message: "Geri bildirim güncellenemedi"
      });
    }

    // Create notification for the user
    const userId = feedback.user_id; 
    if (userId) {
        const notificationData = {
            userId: userId,
            title: 'Geri Bildirim Yanıtı',
            message: 'Gönderdiğiniz geri bildirime admin tarafından cevap verildi.',
            type: 'info'
        };

        try {
            const savedNotification = await NotificationModel.createNotification(notificationData);
            
            // Send real-time notification
            if (req.io) {
                console.log(`Emitting feedback notification to user room: ${userId}`);
                req.io.to(String(userId)).emit('notification', {
                    id: savedNotification ? savedNotification.notification_id : Date.now(),
                    title: notificationData.title,
                    message: notificationData.message,
                    type: notificationData.type,
                    read: false,
                    timestamp: savedNotification ? savedNotification.created_at : new Date().toISOString()
                });
            }
        } catch (notifError) {
            console.error('Error creating notification for feedback:', notifError);
        }
    }

    res.status(200).json({
      success: true,
      data: updatedFeedback,
      message: "Geri bildirim yanıtı başarıyla kaydedildi"
    });
  } catch (err) {
    console.error('Error responding to feedback:', err);
    res.status(500).json({
      success: false,
      message: "Geri bildirim yanıtı kaydedilirken bir hata oluştu",
      error: err.message
    });
  }
};

// Doktor silme endpoint'i
exports.deleteDoctor = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const deletedDoctor = await deleteDoctor(doctorId);

    if (!deletedDoctor) {
      return res.status(404).json({
        success: false,
        message: "Silinecek doktor bulunamadı"
      });
    }

    res.status(200).json({
      success: true,
      message: "Doktor başarıyla silindi"
    });
  } catch (err) {
    console.error('Error deleting doctor:', err);
    res.status(500).json({
      success: false,
      message: "Doktor silinirken bir hata oluştu",
      error: err.message
    });
  }
};


// ID'ye göre randevu bilgilerini getiren endpoint
exports.getAppointmentById = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const appointment = await getAppointmentById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Randevu bulunamadı"
      });
    }

    res.status(200).json({
      success: true,
      data: appointment,
      message: "Randevu bilgileri başarıyla getirildi"
    });
  } catch (err) {
    console.error('Error fetching appointment:', err);
    res.status(500).json({
      success: false,
      message: "Randevu bilgileri getirilirken bir hata oluştu",
      error: err.message
    });
  }
};

// ID'ye göre reçete bilgilerini getiren endpoint
exports.getPrescriptionById = async (req, res) => {
  try {
    const prescriptionId = req.params.id;
    const prescription = await getPrescriptionById(prescriptionId);
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Reçete bulunamadı"
      });
    }

    res.status(200).json({
      success: true,
      data: prescription,
      message: "Reçete bilgileri başarıyla getirildi"
    });
  } catch (err) {
    console.error('Error fetching prescription:', err);
    res.status(500).json({
      success: false,
      message: "Reçete bilgileri getirilirken bir hata oluştu",
      error: err.message
    });
  }
};

// ID'ye göre doktor bilgilerini getiren endpoint
exports.getDoctorById = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const doctor = await getDoctorProfileByUserId(doctorId);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doktor bulunamadı"
      });
    }

    res.status(200).json({
      success: true,
      data: doctor,
      message: "Doktor bilgileri başarıyla getirildi"
    });
  } catch (err) {
    console.error('Error fetching doctor:', err);
    res.status(500).json({
      success: false,
      message: "Doktor bilgileri getirilirken bir hata oluştu",
      error: err.message
    });
  }
};