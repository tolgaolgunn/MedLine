const db = require('../config/db');

/**
 * Medical Results model
 * Doktorların hastalar için girdiği sonuç kayıtlarını yönetir.
 */

const createMedicalResult = async ({ doctorId, patientId, title, details }) => {
  const result = await db.query(
    `
      INSERT INTO medical_results (doctor_id, patient_id, title, details)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [doctorId, patientId, title, details]
  );

  return result.rows[0];
};

const getResultsByPatientId = async (patientId) => {
  const result = await db.query(
    `
      SELECT 
        mr.result_id,
        mr.title,
        mr.details,
        mr.created_at + INTERVAL '3 hours' AS created_at,
        mr.updated_at,
        u.full_name AS doctor_name,
        COALESCE(
          json_agg(
            json_build_object(
              'file_id', mrf.file_id,
              'file_path', mrf.file_path,
              'original_name', mrf.original_name,
              'mime_type', mrf.mime_type,
              'created_at', mrf.created_at
            )
          ) FILTER (WHERE mrf.file_id IS NOT NULL),
          '[]'::json
        ) AS files
      FROM medical_results mr
      JOIN users u ON mr.doctor_id = u.user_id
      LEFT JOIN medical_result_files mrf ON mr.result_id = mrf.result_id
      WHERE mr.patient_id = $1
      GROUP BY mr.result_id, mr.title, mr.details, mr.created_at, mr.updated_at, u.full_name
      ORDER BY mr.created_at DESC
    `,
    [patientId]
  );

  return result.rows;
};

const getResultDetailForPatient = async (patientId, resultId) => {
  const result = await db.query(
    `
      SELECT 
        mr.result_id,
        mr.title,
        mr.details,
        mr.created_at + INTERVAL '3 hours' AS created_at,
        mr.updated_at,
        u.full_name AS doctor_name,
        COALESCE(
          json_agg(
            json_build_object(
              'file_id', mrf.file_id,
              'file_path', mrf.file_path,
              'original_name', mrf.original_name,
              'mime_type', mrf.mime_type,
              'created_at', mrf.created_at
            )
          ) FILTER (WHERE mrf.file_id IS NOT NULL),
          '[]'::json
        ) AS files
      FROM medical_results mr
      JOIN users u ON mr.doctor_id = u.user_id
      LEFT JOIN medical_result_files mrf ON mr.result_id = mrf.result_id
      WHERE mr.patient_id = $1 AND mr.result_id = $2
      GROUP BY mr.result_id, mr.title, mr.details, mr.created_at, mr.updated_at, u.full_name
      LIMIT 1
    `,
    [patientId, resultId]
  );

  return result.rows[0];
};

module.exports = {
  createMedicalResult,
  getResultsByPatientId,
  getResultDetailForPatient,
};

