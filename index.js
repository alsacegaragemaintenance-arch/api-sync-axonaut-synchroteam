// index.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// 🔹 Logs de debug
console.log("🚀 Début du serveur");

// 🔹 Variables d'environnement
const PORT = process.env.PORT || 3000;
const AXONAUT_API_KEY = process.env.AXONAUT_API_KEY;
const SYNCHROTEAM_API_KEY = process.env.SYNCHROTEAM_API_KEY;
const SYNCHROTEAM_URL = process.env.SYNCHROTEAM_URL;
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN;

// Vérification rapide
if (!AXONAUT_API_KEY || !SYNCHROTEAM_API_KEY || !WEBHOOK_TOKEN) {
  console.warn("⚠️ Une ou plusieurs variables d'environnement sont manquantes !");
}

// 🔹 Endpoint racine
app.get('/', (req, res) => {
  res.send("API Full Sync Axonaut <-> Synchroteam active");
});

// 🔹 Endpoint santé
app.get('/health', (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// 🔹 Webhook Axonaut (création / modification client)
app.post('/axonaut/client', async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (token !== WEBHOOK_TOKEN) return res.status(401).json({ error: "Token invalide" });

    const clientData = req.body;
    console.log("📥 Client reçu d'Axonaut :", clientData);

    // TODO : créer / mettre à jour le client dans Synchroteam
    res.status(200).json({ message: "Webhook Axonaut reçu" });
  } catch (error) {
    console.error("❌ Erreur webhook Axonaut :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 🔹 Webhook Synchroteam (intervention validée)
app.post('/synchroteam/intervention', async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (token !== WEBHOOK_TOKEN) return res.status(401).json({ error: "Token invalide" });

    const interventionData = req.body;
    console.log("📥 Intervention reçue de Synchroteam :", interventionData);

    // TODO : mettre à jour la facture Axonaut
    res.status(200).json({ message: "Webhook Synchroteam reçu" });
  } catch (error) {
    console.error("❌ Erreur webhook Synchroteam :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 🔹 Démarrage serveur
app.listen(PORT, () => console.log(`▶ Serveur actif sur le port ${PORT}`));
