const db = require("../config/db");

const getUserByEmail = async (email) => {
  const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0];
};

const createUser = async (name, surname, email, hashedPassword) => {
  const result = await db.query(
    "INSERT INTO users (name, surname, email, password) VALUES ($1, $2, $3, $4) RETURNING *",
    [name, surname, email, hashedPassword]
  );
  return result.rows[0];
};

module.exports = {
  getUserByEmail,
  createUser,
};
