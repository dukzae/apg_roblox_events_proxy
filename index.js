const express = require("express");
const fetch = require("node-fetch");
const app = express();

const API_KEY = process.env.ROBLOX_API_KEY;
const UNIVERSE_ID = process.env.UNIVERSE_ID;
const SECONDARY_UNIVERSE_ID = process.env.SECONDARY_UNIVERSE_ID;
const SECRET = process.env.SECRET;
const DATASTORE_NAME = "PlayerData";

app.get("/getPlayerData", async (req, res) => {
    if (req.headers["x-shared-secret"] !== SECRET) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.query.userId;
    const universeIdParam = req.query.universeId;

    if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
    }

    // Determine which universe ID to use
    let universeIdToUse = UNIVERSE_ID;
    if (universeIdParam === UNIVERSE_ID) {
        universeIdToUse = SECONDARY_UNIVERSE_ID;
    } else if (universeIdParam === SECONDARY_UNIVERSE_ID) {
        universeIdToUse = UNIVERSE_ID;
    }

    const key = "Player_" + userId;
    const url = `https://apis.roblox.com/datastores/v1/universes/${universeIdToUse}/standard-datastores/datastore/entries/entry?datastoreName=${DATASTORE_NAME}&entryKey=${encodeURIComponent(key)}`;

    try {
        const response = await fetch(url, {
            headers: { "x-api-key": API_KEY }
        });

        if (response.status === 404) {
            return res.status(404).json({ error: "No data found" });
        }

        if (!response.ok) {
            const body = await response.text();
            console.log("Upstream error:", response.status, body);
            return res.status(response.status).json({ error: "Upstream error", status: response.status, detail: body });
        }

        const data = await response.json();
        res.json(data);

    } catch (err) {
        console.log("Proxy error:", err.message);
        res.status(500).json({ error: "Proxy error", detail: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
