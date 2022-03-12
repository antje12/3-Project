const music = require('./classes/music.js');
const metadata = require('./classes/metadata.js');

module.exports = {
    getVideoId: function (url) {
        //https://stackoverflow.com/questions/3452546/how-do-i-get-the-youtube-video-id-from-a-url
        var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        var match = url.match(regExp);
        return (match && match[7].length == 11) ? match[7] : false;
    },
    logTime(start, message) {
        var stop = new Date();
        var end = stop - start;
        console.info(message + ": %dms", end);
    },
    musicObjectFromBody(link, body, filePath) {
        let metadataVar = new metadata(
            body.Thumbnail,
            body.Title,
            body.Artist,
            body.ReleaseDate,
            body.Genre,
            body.Category,
            body.Album,
            body.Writers,
            body.IsTopicMusic,
            body.SongDuration,
            body.Producer,
            body.CoArtist,
            body.RecordLabel,
        );
        let videoId = this.getVideoId(link);
        let now = (new Date()).toISOString().split('T')[0];
        let musicVar = {
            "Id": 0,
            "Metadata": metadataVar,
            "YoutubeLink": videoId,
            "FilePath": filePath,
            "FlagCount": 0,
            "UnFlaggable": false,
            "CreatedBy": "",
            "CreatedAt": now,
            "DeletedBy": "",
            "DeletedAt": ""
        };
        let result = new music(
            musicVar.Id,
            musicVar.Metadata,
            musicVar.YoutubeLink,
            musicVar.FilePath,
            musicVar.FlagCount,
            musicVar.UnFlaggable,
            musicVar.CreatedBy,
            musicVar.CreatedAt,
            musicVar.DeletedBy,
            musicVar.DeletedAt
        );
        return result;
    },
    musicObjectFromDB(dbSong) {
        let metadataVar = new metadata(
            dbSong.ThumbnailPath,
            dbSong.Title,
            dbSong.Artist,
            dbSong.ReleaseDate,
            dbSong.Genre,
            dbSong.Category,
            dbSong.Album,
            dbSong.Writer,
            true,
            dbSong.SongDuration,
            dbSong.Producer,
            dbSong.CoArtist,
            dbSong.RecordLabel)
        let result = new music(
            dbSong.ID,
            metadataVar,
            dbSong.YoutubeLink,
            dbSong.FilePath,
            // Mangler:
            "", // flagCount
            "", // unFlaggable
            "", // createdBy
            "", // createdAt
            "", // deletedBy
            "") // deletedAt
        return result;
    }
};
