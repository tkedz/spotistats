const express = require('express');
const axios = require('axios');
const cors = require('cors')({ origin: true });

const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();

const validateFirebaseIdToken = require('./authMiddleware');

const app = express();
app.use(cors);

app.get('/recently-played', validateFirebaseIdToken, async (req, res) => {
    try {
        const result = await axios.get(
            'https://api.spotify.com/v1/me/player/recently-played?limit=50',
            {
                headers: { Authorization: `Bearer ${req.spotifyAccessToken}` },
            }
        );
        res.status(200).send(result.data);
    } catch (error) {
        console.log(error);
        res.status(400).json({
            error: 'Error occured while fetching data from Spotify',
        });
    }
});

app.get('/top/:type', validateFirebaseIdToken, async (req, res) => {
    const type = req.params.type;
    if (type === 'artists' || type === 'tracks') {
        try {
            const timeRange = [
                'long_term',
                'medium_term',
                'short_term',
            ].includes(req.query.time_range)
                ? req.query.time_range
                : 'medium_term';

            const result = await axios.get(
                `https://api.spotify.com/v1/me/top/${type}?time_range=${timeRange}&limit=50`,
                {
                    headers: {
                        Authorization: `Bearer ${req.spotifyAccessToken}`,
                    },
                }
            );
            res.status(200).send(result.data);
        } catch (error) {
            console.log(error);
            res.status(400).json({
                error: 'Error occured while fetching data from Spotify',
            });
        }
    } else {
        res.status(400).json({ error: 'Wrong path' });
        return;
    }
});

module.exports = app;
