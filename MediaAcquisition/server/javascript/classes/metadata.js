/**
 * A metadata object
 */
class Metadata {
    /**
    * A constructor
    */
    constructor(
        thumbnail,
        title,
        artist,
        releaseDate,
        genre,
        category,
        album,
        writers,
        isTopicMusic,
        songDuration,
        producer,
        coArtist,
        recordLabel) {
        this.Thumbnail = thumbnail
        this.Title = title;
        this.Artist = artist;
        this.ReleaseDate = releaseDate;
        this.Genre = genre;
        this.Category = category;
        this.Album = album;
        this.Writers = writers;
        this.IsTopicMusic = isTopicMusic;
        this.SongDuration = songDuration;
        this.Producer = producer;
        this.CoArtist = coArtist;
        this.RecordLabel = recordLabel;
    }

    /**
    * Test if music
    */
    isMusic() {
        return this.Category == "Music" || this.IsTopicMusic;
    }
}

module.exports = Metadata