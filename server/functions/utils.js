const axios = require('axios');
const _ = require('lodash');

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

const mapAlbums = (item) => {
    return {
        name: item.name,
        artists: item.artists.map((artist) => {
            return artist.name;
        }),
        image: item.images[0].url,
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

exports.getUsersTop = getUsersTop;
exports.mapResponse = mapResponse;
exports.mapTracks = mapTracks;
exports.mapAlbums = mapAlbums;
exports.prepareStats = prepareStats;
