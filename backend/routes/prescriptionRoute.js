// routes/prescriptionRoutes.js
const express = require('express');
const router = express.Router();
const PrescriptionController = require('../controllers/prescriptionController');

// Frontend'inizin kullandığı endpoint
router.post('/add_prescription', PrescriptionController.addPrescription);

// Diğer endpoints
router.get('/', PrescriptionController.getAllPrescriptions);
router.get('/:id', PrescriptionController.getPrescriptionById);
router.put('/:id', PrescriptionController.updatePrescription);
router.delete('/:id', PrescriptionController.deletePrescription);

// Ek endpoints
router.get('/patient/:patientId', PrescriptionController.getPatientPrescriptions);
router.patch('/:id/status', PrescriptionController.updatePrescriptionStatus);

module.exports = router;