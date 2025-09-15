const db = require("../config/db");

const checkLicenseNumber = async (license_number) => {
  const result = await db.query(
    "SELECT COUNT(*) FROM doctor_profiles WHERE license_number = $1",
    [license_number]
  );
  return parseInt(result.rows[0].count) > 0;
};

const createDoctorProfile = async (user_id, specialty, license_number, experience_years, biography, city, district, hospital_name, approved_by_admin = true) => {
  const result = await db.query(
    `INSERT INTO doctor_profiles (user_id, specialty, license_number, experience_years, biography, city, district, hospital_name, approved_by_admin)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [user_id, specialty, license_number, experience_years, biography, city, district, hospital_name, approved_by_admin]
  );
  return result.rows[0];
};

const getDoctorProfileByUserId = async (user_id) => {
  const result = await db.query(
    `SELECT 
      u.user_id,
      u.full_name,
      u.email,
      u.phone_number,
      u.created_at as user_created_at,
      u.updated_at as user_updated_at,
      u.is_approved,
      d.specialty,
      d.license_number,
      d.experience_years,
      d.biography,
      d.city,
      d.district,
      d.hospital_name,
      d.approved_by_admin,
      d.created_at as profile_created_at,
      d.updated_at as profile_updated_at
    FROM users u
    JOIN doctor_profiles d ON u.user_id = d.user_id
    WHERE u.user_id = $1 AND u.role = 'doctor'`,
    [user_id]
  );
  return result.rows[0];
};

const updateDoctorProfile = async (user_id, fields) => {
  // Sadece gönderilen alanları güncelle
  const allowedFields = [
    'specialty', 'license_number', 'experience_years', 'biography', 'city', 'district', 'hospital_name', 'approved_by_admin'
  ];
  const setClauses = [];
  const values = [];
  let idx = 1;
  for (const key of allowedFields) {
    if (fields[key] !== undefined) {
      setClauses.push(`${key} = $${idx}`);
      values.push(fields[key]);
      idx++;
    }
  }
  if (setClauses.length === 0) {
    throw new Error('Güncellenecek alan yok.');
  }
  setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
  const query = `UPDATE doctor_profiles SET ${setClauses.join(', ')} WHERE user_id = $${idx} RETURNING *`;
  values.push(user_id);
  const result = await db.query(query, values);
  return result.rows[0];
};


const getAllDoctorsWithUser = async () => {
  const result = await db.query(`
    SELECT 
      u.user_id, 
      u.full_name, 
      u.email, 
      u.phone_number, 
      d.specialty, 
      d.license_number, 
      d.experience_years, 
      d.biography, 
      d.city, 
      d.district, 
      d.hospital_name,
      u.created_at AS member_since,
      u.is_approved,
      d.approved_by_admin
    FROM users u
    JOIN doctor_profiles d ON u.user_id = d.user_id
    WHERE u.role = 'doctor' AND u.is_approved = TRUE AND d.approved_by_admin = TRUE
  `);
  return result.rows;
};

const deleteDoctor = async (user_id) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // İlk olarak doktorun randevularını kontrol et
    const appointmentsCheck = await client.query(
      "SELECT COUNT(*) FROM appointments WHERE doctor_id = $1 AND status NOT IN ('cancelled', 'completed')",
      [user_id]
    );

    if (parseInt(appointmentsCheck.rows[0].count) > 0) {
      throw new Error('Aktif randevuları olan doktor silinemez.');
    }

    // Doktorun tüm randevularını güncelle (iptal et veya geçmiş olarak işaretle)
    await client.query(
      `UPDATE appointments 
       SET status = CASE 
         WHEN datetime < CURRENT_TIMESTAMP THEN 'completed'
         ELSE 'cancelled'
       END
       WHERE doctor_id = $1`,
      [user_id]
    );

    // Doktor profilini sil
    await client.query(
      "DELETE FROM doctor_profiles WHERE user_id = $1",
      [user_id]
    );

    // Kullanıcı kaydını sil
    const result = await client.query(
      "DELETE FROM users WHERE user_id = $1 AND role = 'doctor' RETURNING *",
      [user_id]
    );

    if (result.rows.length === 0) {
      throw new Error('Doktor bulunamadı.');
    }

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createDoctorProfile,
  getDoctorProfileByUserId,
  updateDoctorProfile,
  getAllDoctorsWithUser,
  deleteDoctor
}; 