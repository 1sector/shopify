// src/controllers/shopifyController.js

const axios = require("axios");
// Импортируем pool из db.js (путь может отличаться,
// главное, чтобы указывал на ваш db.js)
const pool = require("../db");

// 1. Начало OAuth: /shopify/auth
exports.handleAuth = (req, res) => {
  const { shop } = req.query;
  if (!shop) {
    return res.status(400).send("Missing shop parameter");
  }

  // Формируем URL для авторизации
  const authUrl = `https://${shop}/admin/oauth/authorize`
    + `?client_id=${process.env.SHOPIFY_API_KEY}`
    + `&scope=${process.env.SHOPIFY_SCOPES}`
    + `&redirect_uri=${process.env.SHOPIFY_REDIRECT_URI}`;

  return res.redirect(authUrl);
};

// 2. Коллбэк после установки: /shopify/auth/callback
exports.handleAuthCallback = async (req, res) => {
  const { shop, code } = req.query;
  if (!shop || !code) {
    return res.status(400).send("Invalid request: missing shop or code");
  }

  try {
    // Обмениваем code на постоянный access_token
    const tokenResponse = await axios.post(
      `https://${shop}/admin/oauth/access_token`,
      {
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code,
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // (Дополнительно) Сохраняем shop и токен в сессии
    // (если вам ещё нужно использовать их в сессии)
    req.session.shop = shop;
    req.session.accessToken = accessToken;

    // Сохраняем в БД (INSERT ... ON CONFLICT для PostgreSQL)
    // Убедитесь, что таблица shops уже создана:
    // CREATE TABLE IF NOT EXISTS shops (
    //   id SERIAL PRIMARY KEY,
    //   shop_domain TEXT UNIQUE NOT NULL,
    //   access_token TEXT,
    //   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    //   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    // );
    await pool.query(`
      INSERT INTO shops (shop_domain, access_token)
      VALUES ($1, $2)
      ON CONFLICT (shop_domain)
      DO UPDATE SET access_token = EXCLUDED.access_token, updated_at = NOW()
    `, [shop, accessToken]);

    return res.send("✅ Shopify app установлен! Токен сохранён в БД. Теперь можно подключать Monobank.");
  } catch (error) {
    console.error("Ошибка авторизации:", error?.response?.data || error.message);
    return res.status(500).send("Ошибка авторизации");
  }
};