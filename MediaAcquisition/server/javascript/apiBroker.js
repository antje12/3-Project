const ytdl = require('ytdl-core');
const fetch = require('node-fetch');
const metadata = require('./classes/metadata.js');
const error = require('./classes/error.js');
const utils = require('./utils');

module.exports = {
    getMetaDataAsync: async function (link) {

        let vidId = utils.getVideoId(link);
        let fileMetaData, youtubeApiData;

        let googleApiLink =
            'https://www.googleapis.com/youtube/v3/videos' +
            '?part=contentDetails,topicDetails,snippet' +
            '&id=' + vidId +
            '&key=AIzaSyDy0We_YOiCywDzEMOrCsKn4XPVwBXoy5o';

        let ytdlPromise = ytdl.getBasicInfo(link);
        let googleapiPromise = fetch(googleApiLink);

        try {
            [fileMetaData, youtubeApiData] = await Promise.all([ytdlPromise, googleapiPromise]);
        } catch (err) {
            return new error("External API's failed to scan link")
        }

        let videoDetails = fileMetaData.videoDetails;
        let playerResponse = fileMetaData.player_response.videoDetails;
        let youtubeData = await youtubeApiData.json();
        let genreString = "";
        let isTopicMusic = false;

        // eslint-disable-next-line no-prototype-builtins
        if (youtubeData.items[0].hasOwnProperty('topicDetails')) {
            let genreData = getGenreData(youtubeData, isTopicMusic);
            genreString = genreData.genreString;
            isTopicMusic = genreData.isTopicMusic;
        }
        else {
            let categoryId = youtubeData.items[0].snippet.categoryId;
            isTopicMusic = categoryId == 10;
        }

        let title = playerResponse.title || youtubeData.items[0].snippet.title;
        let artist = videoDetails.keywords[0];
        if (!title.toLowerCase().includes(artist.toLowerCase())) {
            artist = playerResponse.author;
        }

        let thumbnailCount = videoDetails.thumbnail.thumbnails.length;
        let thumbnail = videoDetails.thumbnail.thumbnails[thumbnailCount - 1];
        let metaData = {
            "Thumbnail": thumbnail.url,
            //If it doesnt exist as music data, then use the title of the video
            "Title": title,
            "Artist": artist,
            "ReleaseDate": videoDetails.publishDate,
            "Genre": genreString,
            "Category": videoDetails.category,
            "Album": "",
            "Writers": artist,
            "IsTopicMusic": isTopicMusic,
            "SongDuration": youtubeData.items[0].contentDetails.duration.replace("PT", "")
        };

        let result = new metadata(
            metaData.Thumbnail,
            metaData.Title,
            metaData.Artist,
            metaData.ReleaseDate,
            metaData.Genre,
            metaData.Category,
            metaData.Album,
            metaData.Writers,
            metaData.IsTopicMusic,
            metaData.SongDuration
        );
        return result;
    }
};

/**
 * Gets genre data from youtube metadata
 */
function getGenreData(youtubeData, isTopicMusic) {
    let topicArray = youtubeData.items[0].topicDetails.topicCategories;
    let topicString = topicArray.toString().split(",");
    let genreString = [topicString.length];

    for (let i = 0; i < topicString.length; i++) {
        genreString[i] = topicString[i]
            .slice(30, topicString[i].length)
            .split('_').join(' ');
    }

    let filterFunc = function filterMusicTopic(genre) {
        if (genre == "Music") {
            isTopicMusic = true;
        }
        return genre != "Music";
    }

    genreString = genreString.filter(filterFunc)
    if (genreString.length > 0) {
        for (let i = 1; i < genreString.length; i++) {
            genreString[i] = " " + genreString[i];
        }
    }

    return { genreString, isTopicMusic };
}
