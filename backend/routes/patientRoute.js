const express = require("express");
const router = express.Router();
const patientController = require('../controllers/patientController');

router.post('/appointments', patientController.createAppointment);
router.get('/appointments/:userId', patientController.getAppointmentsByUser);
router.get('/doctor-appointments/:doctor_id/:date', patientController.getDoctorAppointmentsByDate);

module.exports = router;
