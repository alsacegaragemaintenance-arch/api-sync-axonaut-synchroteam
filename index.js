// index.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// 🔹 Variables d'environnement
const PORT = process.env.PORT || 3000;
const WEBHOOK_TOKEN = process.env.AXO_WEBHOOK_TOKEN;
const SYNCHROTEAM_API_KEY = process.env.ST_API_KEY;
const SYNCHROTEAM_DOMAIN = process.env.ST_DOMAIN; // ex: agm.synchroteam.com
const SYNCHROTEAM_URL = `https://ws.synchroteam.com/Api/v2`; // base API v2

// 🔹 Encode Basic Auth pour Synchroteam
const authHeader = 'Basic ' + Buffer.from(`${SYNCHROTEAM_DOMAIN}:${SYNCHROTEAM_API_KEY}`).toString('base64');

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
            ContactName: clientData.name,
            ContactPhone: clientData.number,
            ContactEmail: clientData.email
        };

        // 🔹 Vérifier si le client existe déjà par email
        const searchUrl = `${SYNCHROTEAM_URL}/Customer/List?contactEmail=${encodeURIComponent(clientData.email)}`;
        const searchResponse = await axios.get(searchUrl, {
            headers: {
                'Authorization': authHeader,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (searchResponse.data && searchResponse.data.length > 0) {
            // Client existe → mise à jour
            const clientId = searchResponse.data[0].CustomerId;
            const updateUrl = `${SYNCHROTEAM_URL}/Customer/Send`;
            await axios.post(updateUrl, {
                CustomerId: clientId,
                ...synchroData
            }, {
                headers: {
                    'Authorization': authHeader,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            console.log(`✏️ Client existant mis à jour dans Synchroteam : ${clientId}`);
        } else {
            // Client n'existe pas → création
            const createUrl = `${SYNCHROTEAM_URL}/Customer/Send`;
            const createResponse = await axios.post(createUrl, synchroData, {
                headers: {
                    'Authorization': authHeader,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            console.log(`✅ Nouveau client créé dans Synchroteam : ${createResponse.data.CustomerId || 'ID non retourné'}`);
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
