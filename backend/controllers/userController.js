const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getUserByEmail, createUser, getUserById, updateUserProfile, updateUserPassword } = require("../models/userModel");
const { sendResetMail } = require('../services/mailService'); 
const { createPatientProfile, updatePatientProfile, getPatientProfileByUserId } = require("../models/patientProfileModel");
const { createDoctorProfile, getAllDoctorsWithUser } = require("../models/doctorProfileModel");

exports.register = async (req, res) => {
  const { full_name, email, password, phone_number, role, birth_date, gender, address, specialty, license_number, experience_years, biography, city, district, hospital_name } = req.body;

  try {
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Bu e-posta ile kayıtlı kullanıcı zaten var." });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    let user;
    if ((role || "patient") === "doctor") {
      user = await createUser(full_name, email, password_hash, phone_number, "doctor", true);
      await createDoctorProfile(
        user.user_id,
        specialty,
        license_number,
        experience_years || 0,
        biography || null,
        city,
        district,
        hospital_name || null,
        true
      );
    } else {
      user = await createUser(full_name, email, password_hash, phone_number, role || "patient");
      await createPatientProfile(
        user.user_id,
        birth_date || null,
        gender || null,
        address || null
      );
    }

    res.status(201).json({ message: "Kayıt başarılı, yönetici onayı bekleniyor.", user });
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

    if ((user.role === "doctor" || user.role === "admin") && !user.is_approved) {
      return res.status(403).json({ message: "Hesabınız henüz yönetici tarafından onaylanmamıştır." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: "Geçersiz e-posta veya şifre." });
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Giriş başarılı",
      token,
      user: { user_id: user.user_id, full_name: user.full_name, role: user.role }
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
    }
    res.json({ ...user, ...profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { full_name, email, phone_number, birth_date, gender, address } = req.body;


    const updatedUser = await updateUserProfile(user_id, { full_name, email, phone_number });

    if (req.user.role === "patient") {
      await updatePatientProfile(user_id, { birth_date, gender, address });
    }

    res.json({ message: "Profil güncellendi", user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { oldPassword, newPassword } = req.body;

    const user = await getUserById(user_id);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Eski şifre yanlış." });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    await updateUserPassword(user_id, password_hash);

    res.json({ message: "Şifre başarıyla değiştirildi." });
  } catch (err) {
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
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
