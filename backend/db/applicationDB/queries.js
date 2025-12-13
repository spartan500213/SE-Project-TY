const pool = require("./pool");
const bcrypt = require("bcryptjs");

async function addUser({ email, password }) {
  const hashed = await bcrypt.hash(password, 10);
  console.log("Adding user:", email);

  await pool.query("INSERT INTO users (email, password_hash) VALUES ($1, $2)", [
    email,
    hashed,
  ]);
}

async function getUserByEmail(email) {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  return result.rows[0];
}

async function getUserById(id) {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return result.rows[0];
}

module.exports = { addUser, getUserByEmail, getUserById };
