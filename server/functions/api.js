const express = require('express');
const axios = require('axios');
const cors = require('cors')({ origin: true });
const url = require('url');
const _ = require('lodash');

const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();

const {
    getUsersTop,
    mapResponse,
    mapTracks,
    mapAlbums,
    prepareStats,
} = require('./utils');
const validateFirebaseIdToken = require('./authMiddleware');
const config = require('../config/config');
const { getRecommendations } = require('./recommendations');

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
        const data = _.chain(result.data.items)
            .map((item) => item.track)
            .map(mapTracks)
            .value();

        res.status(200).send(data);
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

            const result = await getUsersTop(
                type,
                timeRange,
                req.spotifyAccessToken
            );

            const data = _.chain(result.data.items)
                .map(mapResponse(type))
                .value();
            res.status(200).send(data);
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

app.get(
    '/compare/:comparedUser/',
    validateFirebaseIdToken,
    async (req, res) => {
        try {
            const uid = req.uid;
            const comparedUser = req.params.comparedUser;

            //get comparedUser spotify access token
            const doc = await db.collection('users').doc(comparedUser).get();
            if (!doc.exists)
                throw new Error(`User ${comparedUser} does not exist`);

            let token;
            const avatar = doc.data().avatar;
            //check if current token is still valid
            if (doc.data().spotifyAccessExpiration < Date.now() / 1000) {
                token = doc.data().spotifyAccessToken;
            } else {
                //possible refactor with index/refresh func
                const params = new url.URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: doc.data().spotifyRefreshToken,
                });
                const spotifyResult = await axios.post(
                    `https://accounts.spotify.com/api/token`,
                    params.toString(),
                    {
                        headers: {
                            Authorization:
                                'Basic ' +
                                Buffer.from(
                                    config.spotifyClientId +
                                        ':' +
                                        config.spotifyClientSecret
                                ).toString('base64'),
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                    }
                );

                await db
                    .collection('users')
                    .doc(comparedUser)
                    .update({
                        spotifyAccessToken: spotifyResult.data.access_token,
                        spotifyAccessExpiration: Math.floor(
                            Date.now() / 1000 + spotifyResult.data.expires_in
                        ),
                    });

                token = spotifyResult.data.access_token;
            }

            //prepare requests
            const tokens = [req.spotifyAccessToken, token];
            const type = ['artists', 'tracks'];
            const term = ['short_term', 'medium_term', 'long_term'];

            //requests: [0..2] = myTopArtists; [3..5] = myTopTracks
            //[6..8] = comparedUserTopArtis; [9..11] = comparedUserTopTracks
            let requests = [];
            for (let i = 0; i < tokens.length; i++) {
                for (let j = 0; j < type.length; j++) {
                    for (let n = 0; n < term.length; n++) {
                        requests.push(getUsersTop(type[j], term[n], tokens[i]));
                    }
                }
            }

            const responses = await axios.all(requests);
            const dataToSend = prepareStats(responses, uid, comparedUser);
            dataToSend.comparedUserAvatar = avatar;
            res.status(200).json(dataToSend);
        } catch (error) {
            console.log(error);
            res.status(400).json({ error: error.message });
        }
    }
);

app.get('/search', validateFirebaseIdToken, async (req, res) => {
    try {
        const q = req.query.q;
        if (!q) throw new Error('Search query is empty');

        const result = await axios.get(
            `https://api.spotify.com/v1/search?q=${q}&type=track,album&limit=10`,
            {
                headers: { Authorization: `Bearer ${req.spotifyAccessToken}` },
            }
        );

        const tracks = _.chain(result.data.tracks.items).map(mapTracks).value();

        const albums = _.chain(result.data.albums.items)
            .filter(['album_type', 'album'])
            .map(mapAlbums)
            .value();

        res.status(200).json({ albums, tracks });
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: error.message });
    }
});

app.post('/recommendations', validateFirebaseIdToken, async (req, res) => {
    try {
        let seedTracks = [];
        //req.body contains tracks and albums on the basis of which recommendations will be generated
        for (const item of req.body) {
            if (item.type === 'album') {
                //get all albums tracks
                const result = await axios.get(
                    `https://api.spotify.com/v1/albums/${item.data.id}/tracks`,
                    {
                        headers: {
                            Authorization: `Bearer ${req.spotifyAccessToken}`,
                        },
                    }
                );

                const albumTracks = _.map(result.data.items, (t) => t.id);
                seedTracks = _.concat(seedTracks, albumTracks);
            } else seedTracks.push(item.data.id);
        }

        seedTracks = _.uniq(seedTracks);

        //get audio features of tracks
        //spotify allows to get featurs for max 100 tracks in one request, so we split in chunks
        let seedTracksAudioFeatures = [];
        const chunks = _.chunk(seedTracks, 100);
        for (const chunk of chunks) {
            const ids = _.join(chunk, ',');
            const result = await axios.get(
                `https://api.spotify.com/v1/audio-features?ids=${ids}`,
                {
                    headers: {
                        Authorization: `Bearer ${req.spotifyAccessToken}`,
                    },
                }
            );

            for (const track of result.data.audio_features) {
                seedTracksAudioFeatures.push([
                    track.danceability,
                    track.energy,
                    track.key,
                    track.loudness,
                    track.mode,
                    track.speechiness,
                    track.acousticness,
                    track.instrumentalness,
                    track.liveness,
                    track.valence,
                    track.tempo,
                    track.id,
                ]);
            }
        }
        //console.log(seedTracksAudioFeatures);
        const top = await getRecommendations(seedTracksAudioFeatures);

        if (!top) throw new Error('Could not generate recommendations');
        //get recommended tracks data from spotify
        let recommendedTracks = [];
        for (const id of top) {
            const result = await axios.get(
                `https://api.spotify.com/v1/tracks/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${req.spotifyAccessToken}`,
                    },
                }
            );

            recommendedTracks.push(result.data);
        }

        // Extend custom recommendations with spotify recommendations
        let seedTrackIdsString;
        if (seedTracks.length > 5) {
            seedTrackIdsString = _.chain(seedTracks)
                .shuffle()
                .slice(0, 5)
                .join(',')
                .value();
        } else {
            seedTrackIdsString = _.chain(seedTracks)
                .shuffle()
                .join(',')
                .value();
        }

        console.log('SEEDTRACKS', seedTrackIdsString);
        const result = await axios.get(
            `https://api.spotify.com/v1/recommendations?seed_tracks=${seedTrackIdsString}&limit=20`,
            {
                headers: {
                    Authorization: `Bearer ${req.spotifyAccessToken}`,
                },
            }
        );

        result.data.tracks.forEach((track) => recommendedTracks.push(track));
        recommendedTracks = _.chain(recommendedTracks)
            .map(mapTracks)
            .shuffle()
            .value();

        res.status(200).json(recommendedTracks);
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: error.message });
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

module.exports = app;
