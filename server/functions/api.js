const express = require('express');
const axios = require('axios');
const cors = require('cors')({ origin: true });
const url = require('url');
const _ = require('lodash');

const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();

const validateFirebaseIdToken = require('./authMiddleware');
const config = require('../config/config');

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
        //const data = result.data.items.map(mapTracks);
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
        //return res.send('???');
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

module.exports = app;

//utils functions -> move to another file
const getUsersTop = (type, timeRange, spotifyAccessToken) => {
    return axios.get(
        `https://api.spotify.com/v1/me/top/${type}?time_range=${timeRange}&limit=50`,
        {
            headers: {
                Authorization: `Bearer ${spotifyAccessToken}`,
            },
        }
    );
};

const mapResponse = (type) => {
    switch (type) {
        case 'artists':
            return mapArtists;
            break;
        case 'tracks':
            return mapTracks;
            break;
        default:
            break;
    }
};

const mapTracks = (item) => {
    return {
        artists: item.artists.map((artist) => {
            return artist.name;
        }),
        name: item.name,
        preview_url: item.preview_url,
        popularity: item.popularity,
        spotifyURL: item.external_urls.spotify,
        spotifyURI: item.uri,
        image: item.album.images[0].url,
        id: item.id,
    };
};

const mapArtists = (item) => {
    return {
        name: item.name,
        popularity: item.popularity,
        image: item.images[0].url,
        genres: item.genres,
        followers: item.followers.total,
        spotifyURL: item.external_urls.spotify,
        spotifyURI: item.uri,
        id: item.id,
    };
};

// prettier-ignore
const prepareStats = (arr, uid, comparedUser) => {
    //arr [0,1,2,6,7,8] = artists responses; else tracks
    let [
        myArtistsShort, myArtistsMedium, myArtistsLong, myTracksShort, myTracksMedium, myTracksLong, comparedUserArtistsShort, 
        comparedUserArtistsMedium, comparedUserArtistsLong, comparedUserTracksShort, comparedUserTracksMedium, comparedUserTracksLong,
    ] = arr.map(el => el.data.items).map((el,index) => {
        if ([0,1,2,6,7,8].includes(index)) return el.map(mapArtists)
        else return el.map(mapTracks);
    }); 

    //FOR TEST
    if(uid === comparedUser) comparedUser = 'tmp';

    return {
        short: {
            [uid]: { 
                topArtists: myArtistsShort.slice(0,3), topTracks: myTracksShort.slice(0,3), favGenres: favGenres(myArtistsShort), 
                mostPopularArtists: nOfMax(myArtistsShort, 'popularity', 3), leastPopularArtists: nOfMin(myArtistsShort, 'popularity', 3),
                mostPopularTracks: nOfMax(myTracksShort, 'popularity', 3), leastPopularTracks: nOfMin(myTracksShort, 'popularity', 3)
            },
            [comparedUser]: {
                topArtists: comparedUserArtistsShort.slice(0,3), 
                topTracks: comparedUserTracksShort.slice(0,3), 
                favGenres: favGenres(comparedUserArtistsShort),
                mostPopularArtists: nOfMax(comparedUserArtistsShort, 'popularity', 3),
                leastPopularArtists: nOfMin(comparedUserArtistsShort, 'popularity', 3),
                mostPopularTracks: nOfMax(comparedUserTracksShort, 'popularity', 3), 
                leastPopularTracks: nOfMin(comparedUserTracksShort, 'popularity', 3)
            },
            artistsIntersection: intersection(myArtistsShort, comparedUserArtistsShort, 'id'),
            tracksIntersection: intersection(myTracksShort, comparedUserTracksShort, 'id')
        },
        medium: {
            [uid]: { 
                topArtists: myArtistsMedium.slice(0,3), topTracks: myTracksMedium.slice(0,3), favGenres: favGenres(myArtistsMedium),
                mostPopularArtists: nOfMax(myArtistsMedium, 'popularity', 3), leastPopularArtists: nOfMin(myArtistsMedium, 'popularity', 3),
                mostPopularTracks: nOfMax(myTracksMedium, 'popularity', 3), leastPopularTracks: nOfMin(myTracksMedium, 'popularity', 3)
            },
            [comparedUser]: {
                topArtists: comparedUserArtistsMedium.slice(0,3), 
                topTracks: comparedUserTracksMedium.slice(0,3), 
                favGenres: favGenres(comparedUserArtistsMedium),
                mostPopularArtists: nOfMax(comparedUserArtistsMedium, 'popularity', 3),
                leastPopularArtists: nOfMin(comparedUserArtistsMedium, 'popularity', 3),
                mostPopularTracks: nOfMax(comparedUserTracksMedium, 'popularity', 3), 
                leastPopularTracks: nOfMin(comparedUserTracksMedium, 'popularity', 3)
            },
            artistsIntersection: intersection(myArtistsMedium, comparedUserArtistsMedium, 'id'),
            tracksIntersection: intersection(myTracksMedium, comparedUserTracksMedium, 'id')
        },
        long: {
            [uid]: { 
                topArtists: myArtistsLong.slice(0,3), topTracks: myTracksLong.slice(0,3), favGenres: favGenres(myArtistsLong),
                mostPopularArtists: nOfMax(myArtistsLong, 'popularity', 3), leastPopularArtists: nOfMin(myArtistsLong, 'popularity', 3),
                mostPopularTracks: nOfMax(myTracksLong, 'popularity', 3), leastPopularTracks: nOfMin(myTracksLong, 'popularity', 3) 
            },
            [comparedUser]: {
                topArtists: comparedUserArtistsLong.slice(0,3), 
                topTracks: comparedUserTracksLong.slice(0,3), 
                favGenres: favGenres(comparedUserArtistsLong),
                mostPopularArtists: nOfMax(comparedUserArtistsLong, 'popularity', 3),
                leastPopularArtists: nOfMin(comparedUserArtistsLong, 'popularity', 3),
                mostPopularTracks: nOfMax(comparedUserTracksLong, 'popularity', 3), 
                leastPopularTracks: nOfMin(comparedUserTracksLong, 'popularity', 3)
            },
            artistsIntersection: intersection(myArtistsLong, comparedUserArtistsLong, 'id'),
            tracksIntersection: intersection(myTracksLong, comparedUserTracksLong, 'id')
        }
    }
};

const favGenres = (arr) => {
    let genres = [];
    arr.forEach((el) => {
        el.genres.forEach((genre) => {
            genres.push(genre);
        });
    });

    //count occurences
    let count = {};
    for (const el of genres) {
        if (count[el]) {
            count[el] += 1;
        } else {
            count[el] = 1;
        }
    }

    //get top3
    let fav = [];
    for (let i = 0; i < 3; i++) {
        const key = Object.keys(count).reduce((a, b) =>
            count[a] > count[b] ? a : b
        );
        fav.push(key);
        delete count[key];
    }
    return fav;
};

const nOfMax = (collection, key, n) => {
    return _.chain(collection)
        .sortBy((item) => item[key])
        .reverse()
        .slice(0, n)
        .value();
};

const nOfMin = (collection, key, n) => {
    return _.chain(collection)
        .sortBy((item) => item[key])
        .slice(0, n)
        .value();
};

const intersection = (arr1, arr2, key) =>
    _.intersectionWith(arr1, arr2, (x, y) => x[key] === y[key]);
