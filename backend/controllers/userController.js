const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getUserByEmail, createUser, getUserById, updateUserProfile, updateUserPassword } = require("../models/userModel");
const { sendResetMail } = require('../services/mailService'); 

exports.register = async (req, res) => {
  const { full_name, email, password, phone_number, role } = req.body;

  try {
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "A user with this email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await createUser(full_name, email, password_hash, phone_number, role || "patient");

    res.status(201).json({ message: "Registration successful.", user: user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    if ((user.role === "doctor" || user.role === "admin") && !user.is_approved) {
      return res.status(403).json({ message: "Your account has not been approved by the admin yet." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token, user: { user_id: user.user_id, full_name: user.full_name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const user = await getUserById(user_id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const { password_hash, ...userData } = user;
    res.json(userData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { full_name, email, phone_number } = req.body;

    const updatedUser = await updateUserProfile(user_id, { full_name, email, phone_number });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ message: "Profile updated", user: updatedUser });
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
      return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect." });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    await updateUserPassword(user_id, password_hash);

    res.json({ message: "Password changed successfully." });
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
    return res.json({ message: "If this email exists, a reset link has been sent." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "Token and password are required." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await getUserByEmail(decoded.email);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await updateUserPassword(user.user_id, hashedPassword);

    return res.json({ message: "Password reset successful." });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: error.message || "Password reset failed." });
  }
};
