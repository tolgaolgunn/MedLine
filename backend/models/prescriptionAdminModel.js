const db = require("../config/db");

const getAllPrescriptionsWithDetails = async () => {
  const result = await db.query(
    `SELECT 
      p.prescription_id,
      p.prescription_code,
      p.diagnosis,
      p.general_instructions,
      p.usage_instructions,
      p.next_visit_date,
      p.status as prescription_status,
      p.created_at as prescribed_at,
      pat.full_name as patient_name,
      pat.email as patient_email,
      doc.full_name as doctor_name,
      doc.email as doctor_email,
      dp.specialty as doctor_specialty,
      dp.hospital_name,
      array_agg(json_build_object(
        'medicine_name', pi.medicine_name,
        'dosage', pi.dosage,
        'frequency', pi.frequency,
        'duration', pi.duration,
        'quantity', pi.quantity
      )) as medicines
    FROM prescriptions p
    JOIN users pat ON p.patient_id = pat.user_id
    JOIN users doc ON p.doctor_id = doc.user_id
    JOIN doctor_profiles dp ON doc.user_id = dp.user_id
    LEFT JOIN prescription_items pi ON p.prescription_id = pi.prescription_id
    GROUP BY 
      p.prescription_id,
      pat.full_name,
      pat.email,
      doc.full_name,
      doc.email,
      dp.specialty,
      dp.hospital_name
    ORDER BY p.created_at DESC`
  );
  return result.rows;
};

const getPrescriptionById = async (prescriptionId) => {
  const result = await db.query(
    `SELECT 
      p.prescription_id,
      p.prescription_code,
      p.diagnosis,
      p.general_instructions,
      p.usage_instructions,
      p.next_visit_date,
      p.status as prescription_status,
      p.created_at as prescribed_at,
      pat.full_name as patient_name,
      pat.email as patient_email,
      doc.full_name as doctor_name,
      doc.email as doctor_email,
      dp.specialty as doctor_specialty,
      dp.hospital_name,
      array_agg(json_build_object(
        'medicine_name', pi.medicine_name,
        'dosage', pi.dosage,
        'frequency', pi.frequency,
        'duration', pi.duration,
        'quantity', pi.quantity
      )) as medicines
    FROM prescriptions p
    JOIN users pat ON p.patient_id = pat.user_id
    JOIN users doc ON p.doctor_id = doc.user_id
    JOIN doctor_profiles dp ON doc.user_id = dp.user_id
    LEFT JOIN prescription_items pi ON p.prescription_id = pi.prescription_id
    WHERE p.prescription_id = $1
    GROUP BY 
      p.prescription_id,
      pat.full_name,
      pat.email,
      doc.full_name,
      doc.email,
      dp.specialty,
      dp.hospital_name`,
    [prescriptionId]
  );
  return result.rows[0];
};

const updatePrescription = async (prescriptionId, updateData) => {
  // İlk olarak reçeteyi güncelle
  const allowedFields = [
    'diagnosis',
    'general_instructions',
    'usage_instructions',
    'next_visit_date',
    'status'
  ];
  
  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      setClauses.push(`${field} = $${paramIndex}`);
      values.push(updateData[field]);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    throw new Error('Güncellenecek alan bulunamadı');
  }

  values.push(prescriptionId);
  const updateQuery = `
    UPDATE prescriptions 
    SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP 
    WHERE prescription_id = $${paramIndex}
    RETURNING *
  `;

  const result = await db.query(updateQuery, values);

  // Eğer ilaç listesi güncellenmişse
  if (updateData.medicines && Array.isArray(updateData.medicines)) {
    // Önce mevcut ilaçları sil
    await db.query(
      'DELETE FROM prescription_items WHERE prescription_id = $1',
      [prescriptionId]
    );

    // Yeni ilaçları ekle
    for (const medicine of updateData.medicines) {
      await db.query(
        `INSERT INTO prescription_items 
         (prescription_id, medicine_name, dosage, frequency, duration, quantity)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          prescriptionId,
          medicine.medicine_name,
          medicine.dosage,
          medicine.frequency,
          medicine.duration,
          medicine.quantity
        ]
      );
    }
  }

  // Güncellenmiş reçeteyi tüm detaylarıyla getir
  return getPrescriptionById(prescriptionId);
};

const deletePrescription = async (prescriptionId) => {
  // İlk olarak reçete kalemlerini sil (prescription_items tablosundan)
  await db.query(
    'DELETE FROM prescription_items WHERE prescription_id = $1',
    [prescriptionId]
  );

  // Sonra reçeteyi sil
  const result = await db.query(
    'DELETE FROM prescriptions WHERE prescription_id = $1 RETURNING *',
    [prescriptionId]
  );

  return result.rows[0];
};

module.exports = {
  getAllPrescriptionsWithDetails,
  getPrescriptionById,
  updatePrescription,
  deletePrescription
};
