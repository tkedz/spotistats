//commands
//deploy = firebase deploy --only functions:functionName
//run firebase emulator = firebase emulators:start

const functions = require('firebase-functions');
const { getFirestore } = require('firebase-admin/firestore');
const url = require('url');
const axios = require('axios');
const cors = require('cors')({ origin: true });
const config = require('../config/config');
const serviceAccount = require('../config/serviceAccount.json');

const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = getFirestore();

const app = require('./api');
// exports.redirect = functions.https.onRequest((req, res) => {
//     res.redirect(
//         `https://accounts.spotify.com/authorize?client_id=${config.spotifyClientId}&response_type=code&redirect_uri=${config.spotifyRedirectUri}&scope=user-top-read,user-read-recently-played`
//     );
// });

exports.login = functions.https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
        try {
            if (!req.body.code) throw new Error('Incomplete request body');

            const params = new url.URLSearchParams({
                grant_type: 'authorization_code',
                code: req.body.code,
                redirect_uri: config.spotifyRedirectUri,
            });

            //get spotify access token
            let spotifyResult;
            try {
                spotifyResult = await axios.post(
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
            } catch (error) {
                throw new Error('Code already used');
            }

            //get user profile
            const loggedUser = await getMe(spotifyResult.data.access_token);

            //mint custom token for firebase auth using spotify id
            const customToken = await admin
                .auth()
                .createCustomToken(loggedUser.id);

            //exchange custom token for id and refresh tokens
            const firebaseAuthResult = await axios.post(
                `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${config.firebaseWebApiKey}`,
                { token: customToken, returnSecureToken: true }
            );

            const dataToReturn = {
                displayName: loggedUser.display_name,
                id: loggedUser.id,
                images: loggedUser.images,
                //spotifyAccessToken: spotifyResult.data.access_token,
                //spotifyRefreshToken: spotifyResult.data.refresh_token,
                firebaseAccessToken: firebaseAuthResult.data.idToken,
                firebaseRefreshToken: firebaseAuthResult.data.refreshToken,
                expiresIn: 10 * 24 * 60 * 60, // token valid for  10 days
                //expiresIn: 10 * 60, //10min
            };

            //TODO refresh tokens should be stored in database
            await db
                .collection('tokens')
                .doc(loggedUser.id)
                .set({
                    spotifyAccessToken: spotifyResult.data.access_token,
                    spotifyRefreshToken: spotifyResult.data.refresh_token,
                    spotifyAccessExpiration: Math.floor(
                        Date.now() / 1000 + spotifyResult.data.expires_in
                    ),
                });

            res.status(200).json(dataToReturn);
        } catch (error) {
            functions.logger.error(error);
            res.status(400).json({ error: error.message });
        }
    });
});

const getMe = async (accessToken) => {
    const result = await axios.get('https://api.spotify.com/v1/me', {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    return result.data;
};

exports.api = functions.https.onRequest(app);

exports.refresh = functions.https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
        try {
            if (!req.body.uid && !req.body.refreshToken)
                throw new Error('Incomplete request body');

            const refreshResult = await axios.post(
                `https://securetoken.googleapis.com/v1/token?key=${config.firebaseWebApiKey}`,
                {
                    grant_type: 'refresh_token',
                    refresh_token: req.body.refreshToken,
                }
            );

            if (!refreshResult) throw 'You have to log in again';

            const doc = await db.collection('tokens').doc(req.body.uid).get();
            if (!doc.exists) throw 'You have to log in again';

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
                .collection('tokens')
                .doc(req.body.uid)
                .update({
                    spotifyAccessToken: spotifyResult.data.access_token,
                    spotifyAccessExpiration: Math.floor(
                        Date.now() / 1000 + spotifyResult.data.expires_in
                    ),
                });

            res.status(200).json({
                firebaseAccessToken: refreshResult.data.access_token,
            });
        } catch (error) {
            functions.logger.error(error);
            res.status(400).json({ error: error.message });
        }
    });
});
