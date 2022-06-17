const tf = require('@tensorflow/tfjs-node');
const { getStorage } = require('firebase-admin/storage');
const similarity = require('compute-cosine-similarity');

exports.getRecommendations = async (seedTracks) => {
    //get audio features of tracks, and track ids to filter them out from dataset
    const seedTracksAudioFeatures = [];
    const seedTracksIds = [];
    seedTracks.forEach((t) => {
        seedTracksAudioFeatures.push(t.slice(0, 11));
        seedTracksIds.push(t[11]);
    });

    //read data from cloud storage
    try {
        const file = await getStorage()
            .bucket()
            .file('tracks_data.json')
            .download();

        //parse dataset file and filter out seed tracks
        const fileData = JSON.parse(file[0].toString('utf-8')).filter(
            (i) => !seedTracksIds.includes(i[0])
        );

        //get audio features of all tracks from dataset
        let tracksData = fileData.map((i) => i.slice(3));
        //console.log(tracksData);

        let seedTracksTensor = tf.tensor(seedTracksAudioFeatures);
        let tracksDataTensor = tf.tensor(tracksData);
        let joinedTensor = seedTracksTensor.concat(tracksDataTensor);
        //console.log('JOINED TENSOR');
        //joinedTensor.print();

        let min = joinedTensor.min(0);
        let max = joinedTensor.max(0);
        let normalizedTensor = joinedTensor.sub(min).div(max.sub(min));

        joinedTensor = [];
        min = [];
        max = [];

        //after normalization of joinedTensor, disconnect it again
        seedTracksTensor = normalizedTensor.slice(
            [0, 0],
            [seedTracksAudioFeatures.length, seedTracksAudioFeatures[0].length]
        );
        tracksDataTensor = normalizedTensor.slice([
            seedTracksAudioFeatures.length,
            0,
        ]);
        normalizedTensor = [];

        //get mean of every column in seedTracksTensor
        const seedTracksMean = seedTracksTensor.mean(0).arraySync();
        tracksData = tracksDataTensor.arraySync();
        tracksDataTensor = [];

        //calculate cosine similarity
        let similarityResults = [];
        tracksData.forEach((td, index) => {
            similarityResults.push({
                index,
                similarity: similarity(td, seedTracksMean),
            });
        });

        //sort results and get top 10
        similarityResults.sort((a, b) =>
            a.similarity < b.similarity ? 1 : -1
        );

        const top10TrackIds = [];
        similarityResults.slice(0, 10).forEach((track) => {
            top10TrackIds.push(fileData[track.index][0]);
        });
        return top10TrackIds;
    } catch (error) {
        return null;
    }
};
