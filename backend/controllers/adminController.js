const bcrypt = require("bcryptjs");
const { createUser } = require("../models/userModel");
const { 
  createDoctorProfile, 
  getAllDoctorsWithUser,
  getDoctorProfileByUserId 
} = require("../models/doctorProfileModel");
const { getAllFeedbacks, getFeedbackById, respondToFeedback } = require("../models/feedbackModel");
const { getAllAppointmentsWithDetails, getAppointmentById } = require("../models/appointmentModel");
const { getAllPrescriptionsWithDetails, getPrescriptionById } = require("../models/prescriptionAdminModel");
const { getAllPatients, getPatientProfileByUserId } = require("../models/patientProfileModel");

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

  try {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user with doctor role
    const user = await createUser(
      full_name, 
      email, 
      password_hash, 
      phone_number, 
      "doctor", 
      true
    );

    // Create doctor profile
    const doctorProfile = await createDoctorProfile(
      user.user_id,
      specialty,
      license_number,
      experience_years || 0,
      biography || null,
      city,
      district,
      hospital_name || null,
      true // Set approved_by_admin to true
    );

    res.status(201).json({ 
      success: true,
      message: "Doktor başarıyla oluşturuldu",
      data: {
        user,
        doctor_profile: doctorProfile
      }
    });

  } catch (err) {
    console.error('Error creating doctor:', err);
    res.status(500).json({ 
      success: false,
      message: "Doktor oluşturulurken bir hata oluştu",
      error: err.message 
    });
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
    
    res.status(200).json({
      success: true,
      data: feedbacks,
      message: "Geri bildirimler başarıyla getirildi"
    });
  } catch (err) {
    console.error('Error fetching feedbacks:', err);
    res.status(500).json({
      success: false,
      message: "Geri bildirimler getirilirken bir hata oluştu",
      error: err.message
    });
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

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Hasta bulunamadı"
      });
    }

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
    const patientId = req.params.id;
    const updateData = req.body;
    
    const updatedPatient = await updatePatient(patientId, updateData);

    if (!updatedPatient) {
      return res.status(404).json({
        success: false,
        message: "Güncellenecek hasta bulunamadı"
      });
    }

    res.status(200).json({
      success: true,
      data: updatedPatient,
      message: "Hasta bilgileri başarıyla güncellendi"
    });
  } catch (err) {
    console.error('Error updating patient:', err);
    res.status(500).json({
      success: false,
      message: "Hasta bilgileri güncellenirken bir hata oluştu",
      error: err.message
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

// Doktor bilgilerini güncelleme endpoint'i
exports.updateDoctor = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const updateData = req.body;
    
    const updatedDoctor = await updateDoctor(doctorId, updateData);

    if (!updatedDoctor) {
      return res.status(404).json({
        success: false,
        message: "Güncellenecek doktor bulunamadı"
      });
    }

    res.status(200).json({
      success: true,
      data: updatedDoctor,
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

    const updatedFeedback = await respondToFeedback(feedbackId, adminResponse);

    if (!updatedFeedback) {
      return res.status(404).json({
        success: false,
        message: "Geri bildirim bulunamadı"
      });
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