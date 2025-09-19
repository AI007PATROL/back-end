const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");

const app = express();
app.use(express.json());

let client;
let isReady = false;
let latestQR = null;

// Root check
app.get("/", (req, res) => {
  res.send("🚀 WhatsApp AutoMessage Backend Running!");
});

// Start service
app.get("/start", async (req, res) => {
  if (client) {
    return res.json({ status: "already started" });
  }

  client = new Client({ authStrategy: new LocalAuth() });

  client.on("qr", async (qr) => {
    latestQR = await qrcode.toDataURL(qr);
    console.log("📷 New QR generated");
  });

  client.on("ready", () => {
    isReady = true;
    console.log("✅ WhatsApp client is ready");
  });

  client.initialize();
  res.json({ status: "service started, fetch QR at /qr" });
});

// Get QR code
app.get("/qr", (req, res) => {
  if (!latestQR) return res.status(400).json({ error: "QR not generated yet" });
  res.json({ qr: latestQR });
});

// Send messages
app.post("/send", async (req, res) => {
  if (!isReady) return res.status(400).send("Client not ready");

  const { numbers, message } = req.body;
  for (let num of numbers) {
    const chatId = num.includes("@c.us") ? num : `${num}@c.us`;
    await client.sendMessage(chatId, message);
  }
  res.json({ status: "messages sent" });
});

// End service
app.get("/end", (req, res) => {
  if (client) {
    client.destroy();
    client = null;
    isReady = false;
    latestQR = null;
  }
  res.json({ status: "service ended" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
