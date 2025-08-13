const express = require("express");
const router = express.Router();
const patientController = require('../controllers/patientController');

// Appointment routes
router.post('/appointments', patientController.createAppointment);
router.get('/appointments/:userId', patientController.getAppointmentsByUser);
router.get('/doctor-appointments/:doctor_id/:date', patientController.getDoctorAppointmentsByDate);
router.get('/patient-appointments/:patient_id/:date', patientController.getPatientAppointmentsByDate);

// Prescription routes
router.get('/prescriptions/:patientId', patientController.getMyPrescriptions);
router.get('/prescriptions/:patientId/:prescriptionId', patientController.getPrescriptionDetail);
router.put('/prescriptions/:patientId/:prescriptionId/status', patientController.updatePrescriptionStatus);

module.exports = router;
