// src/middleware/verifyToken.js
const jwt = require("jsonwebtoken");
const axios = require("axios");

module.exports = async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const match = authHeader.match(/^Bearer (.+)$/);
    if (!match) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }

    const token = match[1];

    // 1) Сначала декодируем заголовок (header) и пэйлоуд без проверки
    const decodedUnverified = jwt.decode(token, { complete: true });
    if (!decodedUnverified) {
      return res.status(401).json({ error: "Invalid JWT (cannot decode)" });
    }

    const { kid } = decodedUnverified.header; // key ID
    const iss = decodedUnverified.payload.iss; 
    // Обычно iss = "https://{shop_domain}/admin"

    if (!kid || !iss) {
      return res.status(401).json({ error: "JWT missing kid or iss" });
    }

    // 2) Извлекаем shop-домен
    // iss = "https://example.myshopify.com/admin"
    // Уберём "https://" и "/admin"
    const shopDomain = iss.replace(/^https:\/\//, "").replace(/\/admin$/, "");
    if (!shopDomain.endsWith(".myshopify.com")) {
      return res.status(401).json({ error: "iss is not a valid Shopify domain" });
    }

    // 3) Фетчим публичный ключ:
    // GET https://{shop_domain}/admin/oauth/public_keys/{kid}
    const url = `https://${shopDomain}/admin/oauth/public_keys/${kid}`;
    const pubKeyResponse = await axios.get(url);
    const publicKeyPem = pubKeyResponse.data && pubKeyResponse.data.pubkey;
    // pubKeyResponse.data может выглядеть так:
    // { "pubkey": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqh...\n-----END PUBLIC KEY-----" }

    if (!publicKeyPem) {
      return res.status(401).json({ error: "No pubkey in response" });
    }

    // 4) Полная валидация подписи JWT
    const verifiedPayload = jwt.verify(token, publicKeyPem, {
      algorithms: ["RS256"]
    });
    // Если не упадёт в catch, значит токен валиден

    // 5) Заполняем req.shop (или req.session.shop) для дальнейшего использования
    // Например:
    req.shop = shopDomain;
    req.sessionTokenPayload = verifiedPayload;

    // Переходим к следующим middleware/роутам
    next();

  } catch (err) {
    console.error("JWT verify error:", err);
    return res.status(401).json({ error: "Invalid session token" });
  }
};