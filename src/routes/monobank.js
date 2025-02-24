// src/routes/monobank.js

const express = require("express");
const router = express.Router();

const {
  createInvoice,
  handleWebhook,
  paymentSuccess,
} = require("../controllers/monobankController");

// POST /monobank/create-invoice
router.post("/create-invoice", createInvoice);

// GET /monobank/payment-success
router.get("/payment-success", paymentSuccess);

// POST /monobank/webhook
router.post("/webhook", handleWebhook);


module.exports = router;