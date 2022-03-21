//commands
//deploy = firebase deploy --only functions:functionName
//run firebase emulator = firebase emulators:start

const functions = require('firebase-functions');
const express = require('express');
const url = require('url');
const axios = require('axios');
const config = require('../config/config');
const serviceAccount = require('../config/serviceAccount.json');
const cors = require('cors')({ origin: true });

const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const app = express();

exports.redirect = functions.https.onRequest((req, res) => {
    res.redirect(
        `https://accounts.spotify.com/authorize?client_id=${config.spotifyClientId}&response_type=code&redirect_uri=${config.spotifyRedirectUri}&scope=user-top-read,user-read-recently-played`
    );
});

exports.login = functions.https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
        try {
            if (!req.body.code) throw 'Incomplete request body';

            const params = new url.URLSearchParams({
                grant_type: 'authorization_code',
                code: req.body.code,
                redirect_uri: config.spotifyRedirectUri,
            });

            //get spotify access token
            const spotifyResult = await axios.post(
                'https://accounts.spotify.com/api/token',
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

            //get user profile
            const loggedUser = await getMe(spotifyResult.data.access_token);
            if (!loggedUser) throw 'Could not get user data';

            //mint custom token for firebase auth using spotify id
            const customToken = await admin
                .auth()
                .createCustomToken(loggedUser.id);

            //exchange custom token for id and refresh tokens
            const firebaseAuthResult = await axios.post(
                `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${config.firebaseWebApiKey}`,
                { token: customToken, returnSecureToken: true }
            );

            //TODO refresh tokens should be stored in database
            const dataToReturn = {
                displayName: loggedUser.display_name,
                id: loggedUser.id,
                images: loggedUser.images,
                spotifyAccessToken: spotifyResult.data.access_token,
                //spotifyRefreshToken: spotifyResult.data.refresh_token,
                firebaseAccessToken: firebaseAuthResult.data.idToken,
                //firebaseRefreshToken: firebaseAuthResult.data.refreshToken,
                expiresIn: 3600,
            };

            res.status(200).json(dataToReturn);
        } catch (error) {
            functions.logger.log(error);
            res.status(400).json({ error });
        }
    });
});

exports.api = functions.https.onRequest(app);

const getMe = async (accessToken) => {
    try {
        const result = await axios.get('https://api.spotify.com/v1/me', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        return result.data;
    } catch (err) {
        console.log(err);
        return null;
    }
};