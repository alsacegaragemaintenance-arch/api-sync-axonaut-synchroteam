require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// 🔹 Variables d'environnement
const PORT = process.env.PORT || 3000;
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN;
const ST_DOMAIN = process.env.ST_DOMAIN;
const ST_API_KEY = process.env.ST_API_KEY;
const SYNCHROTEAM_BASE = process.env.SYNCHROTEAM_BASE; // ex: https://ws.synchroteam.com/api/v3

// 🔹 Générer l’auth Basic pour Synchroteam
const getAuthHeader = () => {
    const token = Buffer.from(`${ST_DOMAIN}:${ST_API_KEY}`).toString('base64');
    return `Basic ${token}`;
};

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

        // 🔹 Vérifier si le client existe déjà (endpoint GET /customer/send)
        const searchUrl = `${SYNCHROTEAM_BASE}/customer/send?email=${encodeURIComponent(synchroData.email)}`;
        const searchResponse = await axios.get(searchUrl, {
            headers: {
                'Authorization': getAuthHeader(),
                'Accept': 'application/json'
            }
        });

        if (searchResponse.data && searchResponse.data.length > 0) {
            // Client existe → mise à jour
            const clientId = searchResponse.data[0].id;
            await axios.put(`${SYNCHROTEAM_BASE}/customer/${clientId}`, synchroData, {
                headers: {
                    'Authorization': getAuthHeader(),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            console.log(`✏️ Client existant mis à jour dans Synchroteam : ${clientId}`);
        } else {
            // Client n'existe pas → création
            const createResponse = await axios.post(`${SYNCHROTEAM_BASE}/customer`, synchroData, {
                headers: {
                    'Authorization': getAuthHeader(),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
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
