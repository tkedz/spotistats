const functions = require('firebase-functions');
const admin = require('firebase-admin');

const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();

const validateFirebaseIdToken = async (req, res, next) => {
    functions.logger.log(
        'Check if request is authorized with Firebase ID token'
    );

    if (
        !req.headers.authorization ||
        !req.headers.authorization.startsWith('Bearer ')
    ) {
        functions.logger.error(
            'No Firebase ID token was passed as a Bearer token in the Authorization header.'
        );
        res.status(403).json({ error: 'Unauthorized' });
        return;
    }

    let idToken;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer ')
    ) {
        functions.logger.log('Found "Authorization" header');
        // Read the ID Token from the Authorization header.
        idToken = req.headers.authorization.split('Bearer ')[1];
    } else {
        res.status(403).json({ error: 'Unauthorized' });
        return;
    }

    try {
        const decodedIdToken = await admin.auth().verifyIdToken(idToken);
        functions.logger.log('ID Token correctly decoded', decodedIdToken);
        req.uid = decodedIdToken.uid;
        req.spotifyAccessToken = await getSpotifyAccessToken(req.uid);
        console.log(req.spotifyAccessToken);
        if (!req.spotifyAccessToken) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        next();
        return;
    } catch (error) {
        functions.logger.error(
            'Error while verifying Firebase ID token:',
            error
        );
        res.status(403).json({ error: 'Unauthorized' });
        return;
    }
};

const getSpotifyAccessToken = async (uid) => {
    console.log(uid);
    const doc = await db.collection('tokens').doc(uid).get();
    console.log(doc.data());
    if (!doc.exists) return null;

    const spotifyAccessToken = doc.data().spotifyAccessToken;
    return spotifyAccessToken;
};

module.exports = validateFirebaseIdToken;
