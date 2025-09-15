const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, isAdmin } = require('../middleware/auth');


// Doctor Routes
const doctorRouter = express.Router();
doctorRouter.post('/add', authenticateToken, isAdmin, adminController.createDoctor);
doctorRouter.get('/all', authenticateToken, isAdmin, adminController.getAllDoctors);
doctorRouter.get('/:id', authenticateToken, isAdmin, adminController.getDoctorById);
doctorRouter.put('/:id', authenticateToken, isAdmin, adminController.updateDoctor);
doctorRouter.delete('/:id', authenticateToken, isAdmin, adminController.deleteDoctor);
router.use('/doctors', doctorRouter);

// Patient Routes
const patientRouter = express.Router();
patientRouter.post('/', authenticateToken, isAdmin, adminController.createPatient);
patientRouter.get('/all', authenticateToken, isAdmin, adminController.getAllPatients);
patientRouter.get('/:id', authenticateToken, isAdmin, adminController.getPatientById);
patientRouter.put('/:id', authenticateToken, isAdmin, adminController.updatePatient);
patientRouter.delete('/:id', authenticateToken, isAdmin, adminController.deletePatient);
router.use('/patients', patientRouter);

// Feedback Routes
const feedbackRouter = express.Router();
feedbackRouter.get('/', authenticateToken, isAdmin, adminController.getAllFeedbacks);
feedbackRouter.put('/:id/respond', authenticateToken, isAdmin, adminController.respondToFeedback);
router.use('/feedbacks', feedbackRouter);

// Appointment Routes
const appointmentRouter = express.Router();
appointmentRouter.get('/', authenticateToken, isAdmin, adminController.getAllAppointments);
appointmentRouter.get('/:id', authenticateToken, isAdmin, adminController.getAppointmentById);
router.use('/appointments', appointmentRouter);

// Prescription Routes
const prescriptionRouter = express.Router();
prescriptionRouter.get('/', authenticateToken, isAdmin, adminController.getAllPrescriptions);
prescriptionRouter.get('/:id', authenticateToken, isAdmin, adminController.getPrescriptionById);
prescriptionRouter.put('/:id', authenticateToken, isAdmin, adminController.updatePrescription);
prescriptionRouter.delete('/:id', authenticateToken, isAdmin, adminController.deletePrescription);
router.use('/prescriptions', prescriptionRouter);


module.exports = router;