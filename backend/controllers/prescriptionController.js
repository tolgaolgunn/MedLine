const db = require("../config/db");

// Reçete durumunu güncelle
exports.updatePrescriptionStatus = async (req, res) => {
  const { prescriptionId } = req.params;
  const { status } = req.body;

  try {
    // Reçetenin var olup olmadığını kontrol et
    const checkResult = await db.query(
      `SELECT p.*, pp.user_id as patient_id
       FROM prescriptions p
       JOIN patient_profiles pp ON p.patient_id = pp.profile_id
       WHERE p.prescription_id = $1`,
      [prescriptionId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Reçete bulunamadı."
      });
    }

    const prescription = checkResult.rows[0];

    // Kullanıcının bu reçeteyi güncelleme yetkisi var mı kontrol et
    if (prescription.patient_id !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: "Bu reçete üzerinde işlem yapma yetkiniz yok."
      });
    }

    // Geçerli durum değerleri
    const validStatuses = ['active', 'used', 'expired', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz reçete durumu."
      });
    }

    // Reçete durumunu güncelle
    const result = await db.query(
      `UPDATE prescriptions 
       SET prescription_status = $1, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE prescription_id = $2 
       RETURNING *`,
      [status, prescriptionId]
    );

    res.json({
      success: true,
      message: "Reçete durumu güncellendi.",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Reçete durumu güncelleme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Reçete durumu güncellenirken bir hata oluştu."
    });
  }
};

// Reçete detaylarını getir
exports.getPrescriptionDetails = async (req, res) => {
  const { prescriptionId } = req.params;

  try {
    const result = await db.query(
      `SELECT 
        p.*,
        d.full_name as doctor_name,
        d.specialty as doctor_specialty,
        d.hospital_name,
        array_agg(json_build_object(
          'item_id', pi.item_id,
          'medicine_name', pi.medicine_name,
          'dosage', pi.dosage,
          'frequency', pi.frequency,
          'duration', pi.duration,
          'usage_instructions', pi.usage_instructions,
          'side_effects', pi.side_effects,
          'quantity', pi.quantity
        )) as medicines
      FROM prescriptions p
      JOIN doctors d ON p.doctor_id = d.doctor_id
      LEFT JOIN prescription_items pi ON p.prescription_id = pi.prescription_id
      WHERE p.prescription_id = $1
      GROUP BY p.prescription_id, d.doctor_id`,
      [prescriptionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Reçete bulunamadı."
      });
    }

    const prescription = result.rows[0];
    
    // Kullanıcının bu reçeteyi görüntüleme yetkisi var mı kontrol et
    if (prescription.patient_id !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: "Bu reçeteyi görüntüleme yetkiniz yok."
      });
    }

    res.json({
      success: true,
      data: prescription
    });

  } catch (error) {
    console.error("Reçete detayları getirme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Reçete detayları alınırken bir hata oluştu."
    });
  }
};
