const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorContoller');
const { authenticateToken, isDoctor } = require('../middleware/auth');

router.use(authenticateToken, isDoctor);

// Doktor istatistikleri
router.get('/patients/count/:doctorId', doctorController.getPatientCount);
router.get('/appointments/pending/count/:doctorId', doctorController.getPendingAppointmentCount);
router.get('/appointments/today/count/:doctorId', doctorController.getTodayAppointmentCount);

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

module.exports = router;