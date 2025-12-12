// Simple Node.js project: Sync Axonaut clients -> Synchroteam
// --------------------------------------------------------------
// This version ONLY listens for Axonaut client creation/modification
// and copies the client into Synchroteam via their API.

// index.js
const express = require('express');
const app = express();
require('dotenv').config();
const axios = require('axios');

app.use(express.json());

// 🔵 1) Endpoint appelé par Axonaut via webhook lorsque un client est créé/modifié
app.post('/axonaut/client', async (req, res) => {
  try {
    const client = req.body;
    console.log('Client reçu depuis Axonaut:', client);

    // 🔵 2) Conversion Axonaut -> Synchroteam
    const syncroClient = {
      Name: client.company_name || client.lastname || "Client",    // nom affiché
      FirstName: client.firstname || "",                           // prénom
      Address1: client.address || "",
      City: client.city || "",
      ZipCode: client.zipcode || "",
      Phone: client.phone || "",
      Email: client.email || "",
    };

    // 🔵 3) Envoi vers Synchroteam
    const response = await axios.post(
      `${process.env.SYNCHROTEAM_URL}/customers`,
      syncroClient,
      {
        headers: {
          'X-ApiKey': process.env.SYNCHROTEAM_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log("Client envoyé à Synchroteam");

    res.json({ success: true, synchroteam: response.data });
  } catch (error) {
    console.error("Erreur Sync:", error.response?.data || error);
    res.status(500).json({ error: "Erreur lors de la synchronisation" });
  }
});

app.get('/', (req, res) => {
  res.send('API Axonaut → Synchroteam active');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));


// .env EXEMPLE
// SYNCHROTEAM_URL=https://app.synchroteam.com/api/v3
// SYNCHROTEAM_API_KEY=xxxxxxxxxxxxxxxxxxxxx
// PORT=3000


// ➜ COMMENT ÇA MARCHE ?
// 1. Axonaut envoie un webhook POST vers /axonaut/client
// 2. L'API convertit les champs
// 3. L'API envoie le client dans Synchroteam
// 4. Client créé/mis à jour automatiquement
