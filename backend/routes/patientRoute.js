const express = require("express");
const router = express.Router();
const patientController = require('../controllers/patientController');
const doctorReviewController = require('../controllers/doctorReviewController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken); // Ensure all patient routes are protected or be selective

// Appointment routes
router.post('/appointments', patientController.createAppointment);
router.get('/appointments/:userId', patientController.getAppointmentsByUser);
router.get('/doctor-appointments/:doctor_id/:date', patientController.getDoctorAppointmentsByDate);
router.get('/patient-appointments/:patient_id/:date', patientController.getPatientAppointmentsByDate);
router.delete('/appointments/:patientId/:appointmentId', patientController.deleteAppointment);

// Prescription routes
router.get('/patient/prescriptions/:patientId', patientController.getMyPrescriptions);
router.get('/patient/prescriptions/:patientId/:prescriptionId', patientController.getPrescriptionDetail);
router.put('/patient/prescriptions/:prescriptionId/status', patientController.updatePrescriptionStatus);

// Medical results routes
router.get('/patient/results/:patientId', patientController.getMyMedicalResults);
router.get('/patient/results/:patientId/:resultId', patientController.getMedicalResultDetail);

// Patient statistics routes
router.get('/patient/prescriptions/active/count/:patientId', patientController.getActivePrescriptionCount);
router.get('/patient/appointments/completed/count/:patientId', patientController.getCompletedAppointmentCount);

// Feedback routes
router.get('/feedback/:userId', patientController.getUserFeedbacks);
router.post('/feedback', patientController.createFeedback);
router.put('/feedback/:feedbackId', patientController.updateFeedback);
router.delete('/feedback/:feedbackId', patientController.deleteFeedback);

// Doctor Rating
router.post('/rate-doctor', doctorReviewController.addReview);

module.exports = router;
