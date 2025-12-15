// index.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// 🔹 Variables d'environnement
const PORT = process.env.PORT || 3000;
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN; // Token webhook Axonaut
const SYNCHROTEAM_API_KEY = process.env.ST_API_KEY;
const SYNCHROTEAM_URL = process.env.SYNCHROTEAM_URL; // ex: https://api.synchroteam.com/v2

// 🔹 Endpoint racine (test navigateur)
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
        // 🔹 Vérification token
        const token = req.headers['authorization']?.split(' ')[1];
        if (token !== WEBHOOK_TOKEN) {
            return res.status(401).json({ error: "Token invalide" });
        }

        const clientData = req.body;
        console.log("📥 Client reçu d'Axonaut :", clientData);

        // 🔹 Préparer les données à envoyer à Synchroteam
        const synchroData = {
            name: clientData.name,
            phone: clientData.number,
            email: clientData.email
        };

        // 🔹 Vérifier si le client existe déjà
        const searchUrl = `${SYNCHROTEAM_URL}/client?email=${encodeURIComponent(synchroData.email)}&api_key=${SYNCHROTEAM_API_KEY}`;
        const searchResponse = await axios.get(searchUrl);

        if (searchResponse.data && searchResponse.data.length > 0) {
            // Client existe → mise à jour
            const clientId = searchResponse.data[0].id;
            await axios.post(`${SYNCHROTEAM_URL}/client?api_key=${SYNCHROTEAM_API_KEY}`, {
                id: clientId,
                ...synchroData
            });
            console.log(`✏️ Client existant mis à jour dans Synchroteam : ${clientId}`);
        } else {
            // Client n'existe pas → création
            const createResponse = await axios.post(`${SYNCHROTEAM_URL}/client?api_key=${SYNCHROTEAM_API_KEY}`, synchroData);
            console.log(`✅ Nouveau client créé dans Synchroteam : ${createResponse.data.id}`);
        }

        res.status(200).json({ message: "Webhook Axonaut traité avec succès" });

    } catch (error) {
        console.error("❌ Erreur webhook Axonaut :", error.message);
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        }

        res.status(500).json({ 
            error: "Erreur serveur", 
            details: error.response?.data || error.message 
        });
    }
});

// 🔹 Démarrage du serveur
app.listen(PORT, () => console.log(`▶ Serveur actif sur le port ${PORT}`));
