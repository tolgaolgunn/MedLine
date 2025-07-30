const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorContoller');

router.get('/patients/count/:doctorId', doctorController.getPatientCount);
router.get('/appointments/pending/count/:doctorId', doctorController.getPendingAppointmentCount);
router.get('/appointments/today/count/:doctorId', doctorController.getTodayAppointmentCount);
router.get('/appointments/:doctorId', doctorController.getAppointmentsByDoctor);
router.patch('/appointments/:appointmentId/status', doctorController.updateAppointmentStatus);
