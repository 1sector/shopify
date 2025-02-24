// src/routes/settings.js

const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /settings - вернуть токен в JSON
router.get("/", async (req, res) => {
  const shopDomain = req.session.shop;
  if (!shopDomain) {
    return res.status(401).json({ error: "No shop in session" });
  }

  try {
    const result = await pool.query(
      "SELECT monobank_token FROM shops WHERE shop_domain = $1",
      [shopDomain]
    );
    const currentToken = result.rows[0]?.monobank_token || "";
    // Возвращаем JSON (React ждёт .json())
    return res.json({ monobank_token: currentToken });
  } catch (err) {
    console.error("Ошибка при GET /settings:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

// POST /settings - сохранить токен
router.post("/", async (req, res) => {
  const shopDomain = req.session.shop;
  if (!shopDomain) {
    return res.status(401).json({ error: "No shop in session" });
  }

  const { monobank_token } = req.body;
  try {
    await pool.query(
      "UPDATE shops SET monobank_token = $1 WHERE shop_domain = $2",
      [monobank_token, shopDomain]
    );
    // Возвращаем JSON вместо простого текста
    return res.json({ success: true, message: "Monobank token saved" });
  } catch (err) {
    console.error("Ошибка при POST /settings:", err);
    return res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;