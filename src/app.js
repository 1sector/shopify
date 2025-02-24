// src/app.js
require("dotenv").config({ path: __dirname + "/../.env" });
console.log("SHOPIFY_API_KEY =", process.env.SHOPIFY_API_KEY);

const path = require("path");
const express = require("express");
const verifyToken = require("./middleware/verifyToken");

const shopifyRoutes = require("./routes/shopify.js");
const monobankRoutes = require("./routes/monobank.js");
const settingsRoutes = require("./routes/settings");

const app = express();

// Добавляем парсинг JSON
app.use(express.json());

// Если нужна папка /public
app.use(express.static("public"));

// Парсим JSON и form-data
app.use(express.urlencoded({ extended: true }));

// Добавляем роуты с проверкой токена
app.use("/settings", verifyToken, settingsRoutes);
app.use("/shopify", shopifyRoutes);
app.use("/monobank", verifyToken, monobankRoutes);

// Путь к React build
const buildPath = path.join(__dirname, "..", "frontend", "build");
console.log("Serving build from:", buildPath);

app.use(express.static(buildPath));

// Фолбэк: любые GET-запросы, не попавшие в /shopify, /monobank, /settings
app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Что-то пошло не так!" });
});

module.exports = app;