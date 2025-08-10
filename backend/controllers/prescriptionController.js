// controllers/prescriptionController.js
const pool = require('../config/db');
const Prescription = require('../models/prescriptionModel');
const PrescriptionItem = require('../models/prescriptionItemModel');
const { v4: uuidv4 } = require('uuid');

class PrescriptionController {
  // Yeni reçete oluşturma - Frontend'inizin çağırdığı endpoint
  static async addPrescription(req, res) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const {
        patientId,
        patientName,
        doctorName,
        date,
        diagnosis,
        medications,
        instructions,
        status,
        nextVisit,
        appointmentId,
        doctorId
      } = req.body;

      // Veri doğrulama
      if (!patientName || !diagnosis || !medications || medications.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Gerekli alanlar eksik: patientName, diagnosis ve medications gereklidir.'
        });
      }

      // İlaç doğrulama
      const validMedications = medications.filter(med => med.name && med.dosage);
      if (validMedications.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'En az bir geçerli ilaç (isim ve doz) gereklidir.'
        });
      }

      // Reçete ana kaydını oluştur
      const prescriptionData = {
        appointmentId: appointmentId || null,
        doctorId: doctorId || 1, // Varsayılan doktor ID'si
        patientId: patientId || null,
        prescriptionCode: `RX-${uuidv4().slice(0, 8).toUpperCase()}`,
        diagnosis: diagnosis.trim(),
        generalInstructions: instructions?.trim() || '',
        usageInstructions: instructions?.trim() || 'Doktor talimatlarına uygun kullanın',
        nextVisitDate: nextVisit || null,
        status: status || 'active'
      };

      const prescription = await Prescription.create(client, prescriptionData);

      // Reçete öğelerini ekle
      const createdItems = [];
      for (const med of validMedications) {
        const itemData = {
          prescriptionId: prescription.prescription_id,
          medicineName: med.name,
          dosage: med.dosage,
          frequency: med.frequency || 'Günde 1 kez',
          duration: med.duration || '7 gün',
          usageInstructions: med.instructions || 'Yemekten sonra alın',
          sideEffects: null,
          quantity: 1
        };
        
        const item = await PrescriptionItem.create(client, itemData);
        createdItems.push(item);
      }

      await client.query('COMMIT');

      // Frontend formatına dönüştürülmiş yanıt
      const responseData = {
        id: prescription.prescription_id,
        patientId: prescription.patient_id,
        patientName: patientName,
        doctorName: doctorName || 'Dr. Bilinmeyen',
        date: prescription.created_at?.split('T')[0] || date || new Date().toISOString().split('T')[0],
        diagnosis: prescription.diagnosis,
        medications: createdItems.map(item => ({
          name: item.medicine_name,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.usage_instructions
        })),
        instructions: prescription.general_instructions || '',
        status: prescription.status || 'active',
        nextVisit: prescription.next_visit_date
      };

      res.status(201).json(responseData);

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Reçete oluşturma hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Reçete oluşturulurken bir hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error.message : 'İç sunucu hatası'
      });
    } finally {
      client.release();
    }
  }

  // Tüm reçeteleri getir
  static async getAllPrescriptions(req, res) {
    try {
      const query = `
        SELECT 
          p.*,
          COALESCE(pat.full_name, 'Bilinmeyen Hasta') as patient_name,
          COALESCE(doc.full_name, 'Dr. Bilinmeyen') as doctor_name
        FROM prescriptions p
        LEFT JOIN users pat ON p.patient_id = pat.user_id AND pat.role = 'patient'
        LEFT JOIN users doc ON p.doctor_id = doc.user_id AND doc.role = 'doctor'
        ORDER BY p.created_at DESC
      `;
      
      const result = await pool.query(query);
      const prescriptions = result.rows;

      // Her reçete için items'ları da getir
      const formattedPrescriptions = [];
      for (const prescription of prescriptions) {
        const items = await PrescriptionItem.findByPrescriptionId(prescription.prescription_id);
        
        formattedPrescriptions.push({
          id: prescription.prescription_id,
          patientId: prescription.patient_id,
          patientName: prescription.patient_name,
          doctorName: prescription.doctor_name,
          date: prescription.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          diagnosis: prescription.diagnosis,
          medications: items.map(item => ({
            name: item.medicine_name,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            instructions: item.usage_instructions
          })),
          instructions: prescription.general_instructions || '',
          status: prescription.status || 'active',
          nextVisit: prescription.next_visit_date
        });
      }

      res.status(200).json(formattedPrescriptions);
    } catch (error) {
      console.error('Reçeteler getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Reçeteler yüklenirken hata oluştu'
      });
    }
  }

  // Tek reçete getir
  static async getPrescriptionById(req, res) {
    try {
      const { id } = req.params;
      
      // Ana reçete bilgisini getir
      const prescription = await Prescription.findById(id);
      if (!prescription) {
        return res.status(404).json({
          success: false,
          message: 'Reçete bulunamadı'
        });
      }

      // İlaçları getir
      const items = await PrescriptionItem.findByPrescriptionId(id);

      // Hasta ve doktor bilgilerini getir
      const query = `
        SELECT 
          p.*,
          COALESCE(pat.full_name, 'Bilinmeyen Hasta') as patient_name,
          COALESCE(doc.full_name, 'Dr. Bilinmeyen') as doctor_name
        FROM prescriptions p
        LEFT JOIN users pat ON p.patient_id = pat.user_id AND pat.role = 'patient'
        LEFT JOIN users doc ON p.doctor_id = doc.user_id AND doc.role = 'doctor'
        WHERE p.prescription_id = $1
      `;
      
      const result = await pool.query(query, [id]);
      const fullPrescription = result.rows[0];

      // Frontend formatına dönüştür
      const formattedPrescription = {
        id: prescription.prescription_id,
        patientId: prescription.patient_id,
        patientName: fullPrescription?.patient_name || 'Bilinmeyen Hasta',
        doctorName: fullPrescription?.doctor_name || 'Dr. Bilinmeyen',
        date: prescription.created_at?.split('T')[0],
        diagnosis: prescription.diagnosis,
        medications: items.map(item => ({
          name: item.medicine_name,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.usage_instructions
        })),
        instructions: prescription.general_instructions || '',
        status: prescription.status,
        nextVisit: prescription.next_visit_date
      };

      res.status(200).json(formattedPrescription);
    } catch (error) {
      console.error('Reçete getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Reçete yüklenirken hata oluştu'
      });
    }
  }

  // Reçete güncelleme
  static async updatePrescription(req, res) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { id } = req.params;
      const {
        patientName,
        diagnosis,
        medications,
        instructions,
        nextVisit,
        status
      } = req.body;

      // Ana reçete bilgilerini güncelle
      const updateQuery = `
        UPDATE prescriptions 
        SET diagnosis = COALESCE($1, diagnosis),
            general_instructions = COALESCE($2, general_instructions),
            next_visit_date = $3,
            status = COALESCE($4, status),
            updated_at = NOW()
        WHERE prescription_id = $5 
        RETURNING *
      `;
      
      const prescriptionResult = await client.query(updateQuery, [
        diagnosis,
        instructions,
        nextVisit || null,
        status,
        id
      ]);

      if (prescriptionResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Reçete bulunamadı'
        });
      }

      // Mevcut items'ları sil ve yenilerini ekle
      if (medications && medications.length > 0) {
        await client.query('DELETE FROM prescription_items WHERE prescription_id = $1', [id]);
        
        const validMedications = medications.filter(med => med.name && med.dosage);
        
        for (const med of validMedications) {
          const itemData = {
            prescriptionId: id,
            medicineName: med.name,
            dosage: med.dosage,
            frequency: med.frequency || 'Günde 1 kez',
            duration: med.duration || '7 gün',
            usageInstructions: med.instructions || 'Yemekten sonra alın',
            quantity: 1
          };
          
          await PrescriptionItem.create(client, itemData);
        }
      }

      await client.query('COMMIT');

      // Güncellenmiş veriyi döndür
      const updatedItems = await PrescriptionItem.findByPrescriptionId(id);
      const responseData = {
        id: prescriptionResult.rows[0].prescription_id,
        patientId: prescriptionResult.rows[0].patient_id,
        patientName: patientName,
        doctorName: 'Dr. Bilinmeyen', // Bu bilgiyi veritabanından çekebilirsiniz
        date: prescriptionResult.rows[0].created_at?.split('T')[0],
        diagnosis: prescriptionResult.rows[0].diagnosis,
        medications: updatedItems.map(item => ({
          name: item.medicine_name,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.usage_instructions
        })),
        instructions: prescriptionResult.rows[0].general_instructions || '',
        status: prescriptionResult.rows[0].status,
        nextVisit: prescriptionResult.rows[0].next_visit_date
      };

      res.status(200).json(responseData);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Reçete güncelleme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Reçete güncellenirken hata oluştu'
      });
    } finally {
      client.release();
    }
  }

  // Reçete silme
  static async deletePrescription(req, res) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { id } = req.params;

      // Önce items'ları sil
      await client.query('DELETE FROM prescription_items WHERE prescription_id = $1', [id]);
      
      // Sonra ana reçeteyi sil
      const result = await client.query('DELETE FROM prescriptions WHERE prescription_id = $1 RETURNING *', [id]);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Reçete bulunamadı'
        });
      }

      await client.query('COMMIT');

      res.status(200).json({
        success: true,
        message: 'Reçete başarıyla silindi'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Reçete silme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Reçete silinirken hata oluştu'
      });
    } finally {
      client.release();
    }
  }

  // Hasta reçetelerini getir
  static async getPatientPrescriptions(req, res) {
    try {
      const { patientId } = req.params;
      
      const prescriptions = await Prescription.findByPatientId(patientId);
      
      // Her reçete için items'ları da getir
      const formattedPrescriptions = [];
      for (const prescription of prescriptions) {
        const items = await PrescriptionItem.findByPrescriptionId(prescription.prescription_id);
        
        formattedPrescriptions.push({
          id: prescription.prescription_id,
          patientId: prescription.patient_id,
          date: prescription.created_at?.split('T')[0],
          diagnosis: prescription.diagnosis,
          medications: items.map(item => ({
            name: item.medicine_name,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            instructions: item.usage_instructions
          })),
          instructions: prescription.general_instructions || '',
          status: prescription.status,
          nextVisit: prescription.next_visit_date
        });
      }
      
      res.status(200).json(formattedPrescriptions);
    } catch (error) {
      console.error('Hasta reçeteleri getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Hasta reçeteleri yüklenirken hata oluştu'
      });
    }
  }

  // Reçete durumunu güncelle
  static async updatePrescriptionStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz durum değeri'
        });
      }

      const updatedPrescription = await Prescription.updateStatus(id, status);

      if (!updatedPrescription) {
        return res.status(404).json({
          success: false,
          message: 'Reçete bulunamadı'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Reçete durumu güncellendi',
        data: updatedPrescription
      });
    } catch (error) {
      console.error('Reçete durum güncelleme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Reçete durumu güncellenirken hata oluştu'
      });
    }
  }
}

module.exports = PrescriptionController;