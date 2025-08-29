const db = require("../config/db");

const getUserByEmail = async (email) => {
  const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0];
};

const getUserByNationalId = async (national_id) => {
  const result = await db.query("SELECT * FROM users WHERE national_id = $1", [national_id]);
  return result.rows[0];
};

const createUser = async (full_name, email, password_hash, phone_number, role, is_approved = false, national_id = null) => {
  const result = await db.query(
    "INSERT INTO users (full_name, email, password_hash, phone_number, role, is_approved, national_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
    [full_name, email, password_hash, phone_number, role, is_approved, national_id]
  );
  return result.rows[0];
};

const getUserById = async (user_id) => {
  const result = await db.query("SELECT * FROM users WHERE user_id = $1", [user_id]);
  return result.rows[0];
};

const updateUserProfile = async (user_id, { full_name, email, phone_number }) => {
  const result = await db.query(
    "UPDATE users SET full_name = $1, email = $2, phone_number = $3, updated_at = CURRENT_TIMESTAMP WHERE user_id = $4 RETURNING *",
    [full_name, email, phone_number, user_id]
  );
  return result.rows[0];
};

async function updateUserPassword(user_id, password_hash) {
  return db.query(
    "UPDATE users SET password_hash = $1 WHERE user_id = $2",
    [password_hash, user_id]
  );
}



module.exports = {
  getUserByEmail,
  createUser,
  getUserById,
  updateUserProfile,
  updateUserPassword,
  getUserByNationalId,
};
