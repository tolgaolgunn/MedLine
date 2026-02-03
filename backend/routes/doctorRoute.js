const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorContoller');
const { authenticateToken, isDoctor } = require('../middleware/auth');
const { upload } = require('../middleware/uploadMiddleware');

router.use(authenticateToken, isDoctor);

// Doktor istatistikleri
router.get('/patients/count/:doctorId', doctorController.getPatientCount);
router.get('/appointments/pending/count/:doctorId', doctorController.getPendingAppointmentCount);
router.get('/appointments/today/count/:doctorId', doctorController.getTodayAppointmentCount);
router.get('/prescriptions/count/:doctorId', doctorController.getPrescriptionCount);

// Randevu işlemleri
router.get('/appointments/active/:doctorId', doctorController.getActiveAppointments);
router.get('/appointments/:doctorId', doctorController.getAppointmentsByDoctor);
router.patch('/appointments/:appointmentId/status', doctorController.updateAppointmentStatus);

// Hasta bilgileri
router.get('/patients/:doctorId', doctorController.getPatientsByDoctor);

// Reçete işlemleri
router.post('/prescriptions', doctorController.addPrescription);
router.get('/prescriptions', doctorController.getAllPrescriptions);
router.get('/prescriptions/:id', doctorController.getPrescriptionById);
router.put('/prescriptions/:id', doctorController.updatePrescription);
router.delete('/prescriptions/:id', doctorController.deletePrescription);
router.get('/patients/:patientId/prescriptions', doctorController.getPatientPrescriptions);
router.patch('/prescriptions/:id/status', doctorController.updatePrescriptionStatus);

// Tıbbi sonuç işlemleri (doktor)
router.get('/results/:patientId', doctorController.getMedicalResultsByPatient);
// Sadece metin sonuç ekleme
router.post('/results', doctorController.addMedicalResult);
// Dosya eklenebilen sonuç ekleme (PDF / görsel)
router.post('/results-with-files', upload.array('files', 5), doctorController.addMedicalResultWithFiles);

module.exports = router;