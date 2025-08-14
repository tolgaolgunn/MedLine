const express = require("express");
const router = express.Router();
const patientController = require('../controllers/patientController');

// Appointment routes
router.post('/appointments', patientController.createAppointment);
router.get('/appointments/:userId', patientController.getAppointmentsByUser);
router.get('/doctor-appointments/:doctor_id/:date', patientController.getDoctorAppointmentsByDate);
router.get('/patient-appointments/:patient_id/:date', patientController.getPatientAppointmentsByDate);
router.delete('/appointments/:patientId/:appointmentId', patientController.deleteAppointment);

// Feedback routes
router.get('/feedback/:userId', patientController.getUserFeedbacks);
router.post('/feedback', patientController.createFeedback);
router.put('/feedback/:feedbackId', patientController.updateFeedback);
router.delete('/feedback/:feedbackId', patientController.deleteFeedback);

module.exports = router;
