const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorContoller');

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

module.exports = router;