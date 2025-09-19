const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const cors = require("cors");   // ✅ Added CORS

const app = express();
app.use(express.json());
app.use(cors());  // ✅ Allow Cloudflare frontend

let client;
let isReady = false;

// Root test route
app.get("/", (req, res) => {
  res.send("🚀 WhatsApp AutoMessage Backend Running!");
});

app.get("/start", async (req, res) => {
  client = new Client({ authStrategy: new LocalAuth() });

  client.on("qr", async (qr) => {
    const qrImage = await qrcode.toDataURL(qr);
    res.json({ qr: qrImage });
  });

  client.on("ready", () => {
    isReady = true;
    console.log("✅ WhatsApp client is ready");
  });

  client.initialize();
});

app.post("/send", async (req, res) => {
  if (!isReady) return res.status(400).send("Client not ready");

  const { numbers, message } = req.body;
  for (let num of numbers) {
    const chatId = num.includes("@c.us") ? num : `${num}@c.us`;
    await client.sendMessage(chatId, message);
  }
  res.json({ status: "messages sent" });
});

app.get("/end", (req, res) => {
  if (client) {
    client.destroy();
    client = null;
    isReady = false;
  }
  res.json({ status: "service ended" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
