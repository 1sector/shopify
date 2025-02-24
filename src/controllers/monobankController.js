// src/controllers/monobankController.js

const axios = require("axios");

// POST /monobank/create-invoice
exports.createInvoice = async (req, res) => {
  try {
    const { orderId, amount, currency = 980 } = req.body;
    // amount в копейках (10000 => 100 грн)
    // 980 = UAH, 840 = USD, и т.д.

    const invoicePayload = {
      amount,
      ccy: currency,
      merchantPaymInfo: {
        reference: `order_${orderId}`,
        destination: `Оплата заказа #${orderId}`,
      },
      redirectUrl: "https://pentestit.me/monobank/payment-success",
      webHookUrl: "https://pentestit.me/monobank/webhook",
    };

    const monoResponse = await axios.post(
      "https://api.monobank.ua/api/merchant/invoice/create",
      invoicePayload,
      {
        headers: {
          "X-Token": process.env.MONOBANK_MERCHANT_TOKEN,
        },
      }
    );

    const { invoiceId, pageUrl } = monoResponse.data;
    console.log("✅ Инвойс создан:", invoiceId, pageUrl);

    // Возвращаем JSON
    return res.json({ invoiceId, pageUrl });
  } catch (error) {
    console.error(
      "Ошибка при создании инвойса Monobank:",
      error?.response?.data || error.message
    );
    return res.status(500).json({ error: "Failed to create invoice" });
  }
};

// GET /monobank/payment-success
exports.paymentSuccess = (req, res) => {
  // Можно отдать простую страницу "Спасибо"
  res.send("Оплата успешно завершена! Спасибо.");
};

// POST /monobank/webhook
exports.handleWebhook = async (req, res) => {
  try {
    const data = req.body;
    console.log("ℹ️ Monobank webhook data:", data);

    const { invoiceId, status, reference } = data;
    const orderId = reference?.replace("order_", "");

    switch (status) {
      case "created":
        break;
      case "processing":
        break;
      case "approved":
        await markOrderAsPaidInShopify(orderId);
        break;
      case "declined":
        await markOrderAsFailedInShopify(orderId);
        break;
      default:
        console.log(`Неизвестный статус: ${status}`);
    }

    // Возвращаем OK
    return res.status(200).send("OK");
  } catch (error) {
    console.error("Ошибка при обработке вебхука Monobank:", error.message);
    return res.status(500).send("Webhook error");
  }
};

// Пример: обновление заказа в Shopify
async function markOrderAsPaidInShopify(orderId) {
  try {
    // Допустим, достаём shopDomain/accessToken из БД...
    console.log(`Заказ #${orderId} помечен как оплачен (approved)`);
  } catch (error) {
    console.error("Ошибка при обновлении заказа в Shopify:", error.message);
  }
}

async function markOrderAsFailedInShopify(orderId) {
  console.log(`Заказ #${orderId} помечен как отклонён (declined)`);
}