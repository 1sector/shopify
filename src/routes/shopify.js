// src/routes/shopify.js
const express = require("express");
const router = express.Router();
const {
  handleAuth,
  handleAuthCallback,
} = require("../controllers/shopifyController.js");

router.get("/auth", handleAuth);
router.get("/auth/callback", handleAuthCallback);

module.exports = router;