const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { getUserByEmail, getUserByNationalId,createUser, getUserById, updateUserProfile, updateUserPassword } = require("../models/userModel");
const { sendResetMail } = require('../services/mailService'); 
const { createPatientProfile, updatePatientProfile, getPatientProfileByUserId } = require("../models/patientProfileModel");
const { getAllDoctorsWithUser, getDoctorProfileByUserId } = require("../models/doctorProfileModel");

exports.register = async (req, res) => {
  const { full_name, email, password, phone_number, role, birth_date, gender, address, national_id, blood_type } = req.body;

  try {
    // E-posta kontrolü
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Bu e-posta ile kayıtlı kullanıcı zaten var." });
    }

    // TC Kimlik kontrolü
    if (national_id) {
      const existingNationalId = await getUserByNationalId(national_id);
      if (existingNationalId) {
        return res.status(400).json({ message: "Bu TC Kimlik numarası ile kayıtlı kullanıcı zaten var." });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await createUser(full_name, email, password_hash, phone_number, role || "patient", true, national_id);
    
    // Yeni hasta profili oluştur - medical_history NULL, blood_type kullanıcıdan gelen değer
    await createPatientProfile(
      user.user_id,
      birth_date || null,
      gender || null,
      address || null,
      null, // medical_history her zaman null
      blood_type || null // blood_type kullanıcının seçimine göre
    );

    res.status(201).json({ message: "Kayıt başarılı!", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(400).json({ message: "Geçersiz e-posta veya şifre." });
    }

    if (user.role === "doctor" && !user.is_approved) {
      return res.status(403).json({ message: "Hesabınız henüz yönetici tarafından onaylanmamıştır." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(400).json({ message: "Geçersiz e-posta veya şifre." });
    }

    // Update last login time with Turkey timezone
    const turkeyTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
    await db.query(
      `UPDATE users SET last_login = $1 WHERE user_id = $2`,
      [turkeyTime, user.user_id]
    );

    const token = jwt.sign(
      { 
        user_id: user.user_id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove sensitive data
    delete user.password_hash;
    
    res.json({
      message: "Giriş başarılı!",
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    let profile = {};
    if (user.role === "patient") {
      profile = await getPatientProfileByUserId(userId) || {};
    } else if (user.role === "doctor") {
      profile = { doctor_profile: await getDoctorProfileByUserId(userId) || {} };
    }

    const responseData = { ...user, ...profile };
    res.json(responseData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { full_name, email, phone_number, birth_date, gender, address, blood_type, specialty, license_number, experience_years, biography, city, district, hospital_name } = req.body;

    // User tablosunu güncelle
    const updatedUser = await updateUserProfile(user_id, { full_name, email, phone_number });

    // Patient profile'ı güncelle (eğer patient ise)
    if (req.user.role === "patient") {
      await updatePatientProfile(user_id, { birth_date, gender, address, blood_type });
    }

    // Doctor profile'ı güncelle (eğer doctor ise)
    let updatedDoctorProfile = null;
    if (req.user.role === "doctor") {
      const { updateDoctorProfile } = require("../models/doctorProfileModel");
      updatedDoctorProfile = await updateDoctorProfile(user_id, {
        specialty,
        license_number,
        experience_years,
        biography,
        city,
        district,
        hospital_name,
        approved_by_admin: undefined 
      });
    }

    res.json({ message: "Profil güncellendi", user: updatedUser, doctor_profile: updatedDoctorProfile });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { oldPassword, newPassword } = req.body;

    console.log('Change password request for user_id:', user_id);
    console.log('Old password provided:', !!oldPassword);
    console.log('New password provided:', !!newPassword);

    const user = await getUserById(user_id);
    if (!user) {
      console.log('User not found for user_id:', user_id);
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    console.log('User found:', user.email);

    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    console.log('Password match result:', isMatch);
    
    if (!isMatch) {
      return res.status(400).json({ message: "Eski şifre yanlış." });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    await updateUserPassword(user_id, password_hash);
    console.log('Password updated successfully for user_id:', user_id);

    res.json({ message: "Şifre başarıyla değiştirildi." });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await getUserByEmail(email);
    if (user) {
      const token = jwt.sign(
        { user_id: user.user_id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      const resetLink = `http://localhost:5173/reset-password?token=${token}`;
      await sendResetMail(user.email, "Password Reset", resetLink);
    }
    return res.json({ message: "Eğer bu e-posta sistemde kayıtlıysa, bir şifre sıfırlama bağlantısı gönderildi." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.checkPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "Token ve şifre gereklidir." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await getUserByEmail(decoded.email);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    // Mevcut şifre ile yeni şifreyi karşılaştır
    const isSamePassword = await bcrypt.compare(password, user.password_hash);
    if (isSamePassword) {
      return res.status(400).json({ message: "Şifreniz önceki şifrenizle aynı olamaz." });
    }

    return res.json({ message: "Şifre uygun." });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: error.message || "Şifre kontrolü başarısız." });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "Token ve şifre gereklidir." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await getUserByEmail(decoded.email);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    // Mevcut şifre ile yeni şifreyi karşılaştır
    const isSamePassword = await bcrypt.compare(password, user.password_hash);
    if (isSamePassword) {
      return res.status(400).json({ message: "Şifreniz önceki şifrenizle aynı olamaz." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await updateUserPassword(user.user_id, hashedPassword);

    return res.json({ message: "Şifre sıfırlandı." });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: error.message || "Şifre sıfırlama başarısız." });
  }
};

exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await getAllDoctorsWithUser();
    
    const appointmentsResult = await db.query(
        `SELECT doctor_id, datetime FROM appointments 
        WHERE datetime >= CURRENT_TIMESTAMP 
        AND status != 'cancelled'`
    );
    const allAppointments = appointmentsResult.rows;

    const doctorsWithAvailability = doctors.map(doctor => {
      const doctorAppointments = allAppointments.filter(app => app.doctor_id === doctor.user_id);
      const nextAvailable = calculateNextAvailable(doctorAppointments);
      return { ...doctor, next_available: nextAvailable };
    });

    res.json(doctorsWithAvailability);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

function calculateNextAvailable(appointments) {
  const now = new Date();
  
  const nowTR_TakingUTCComponents = new Date(now.getTime() + (3 * 60 * 60 * 1000));
  
  const startYear = nowTR_TakingUTCComponents.getUTCFullYear();
  const startMonth = nowTR_TakingUTCComponents.getUTCMonth();
  const startDay = nowTR_TakingUTCComponents.getUTCDate();

  for (let i = 0; i < 14; i++) {
    const trDateVector = new Date(Date.UTC(startYear, startMonth, startDay + i));
    const year = trDateVector.getUTCFullYear();
    const month = trDateVector.getUTCMonth(); // 0-indexed
    const day = trDateVector.getUTCDate();
    const dayOfWeek = trDateVector.getUTCDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const startHour = 9;
    const endHour = 17; 

    for (let hour = startHour; hour < endHour; hour++) {
      for (let min of [0, 30]) {
        const slotRealUTC = new Date(Date.UTC(year, month, day, hour - 3, min));

        if (slotRealUTC <= now) continue;

        // Check if slot is taken
        const isTaken = appointments.some(app => {
          const appDate = new Date(app.datetime);
          return appDate.getTime() === slotRealUTC.getTime();
        });

        if (!isTaken) {
          // Format: "DD.MM.YYYY HH:mm" (TR Time)
          const dayStr = String(day).padStart(2, '0');
          const monthStr = String(month + 1).padStart(2, '0');
          const yearStr = year;
          const hourStr = String(hour).padStart(2, '0');
          const minStr = String(min).padStart(2, '0');
          
          return `${dayStr}.${monthStr}.${yearStr} ${hourStr}:${minStr}`;
        }
      }
    }
  }
  return "Randevu Yok";
}
