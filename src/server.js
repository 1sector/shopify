// src/server.js
const app = require("./app");
const PORT = process.env.PORT || 3001;

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception thrown:", err);
  process.exit(1);
});

app.listen(PORT, (err) => {
  if (err) {
    console.error("Ошибка при запуске сервера:", err);
    process.exit(1);
  }
  console.log(`✅ Сервер запущен на порту ${PORT}`);
});