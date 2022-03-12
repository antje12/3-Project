const error = require('./classes/error.js');
const utils = require('./utils.js');

module.exports = {
  saveMusic: function (pool, music) {

    pool.getConnection(async function (err, connection) {
      if (err) {
        console.log("getConnection error: ", err);
      }

      let musicID;
      let albumID;
      let artistID;
      let genreID;
      let categoryID;
      let producerID;
      let coArtistID;
      let writerID;
      let recordLabelID;

      //#region independent data
      // step 1
      let albumPromise = upsertDbCall(connection, "SELECT * FROM Albums WHERE Album = ?",
        [music.Metadata.Album || ""], 'INSERT INTO Albums (Album) VALUES (?)');

      let artistPromise = upsertDbCall(connection, "SELECT * FROM Artists WHERE Artist = ?",
        [music.Metadata.Artist || ""], "INSERT INTO Artists (Artist) VALUES (?)");

      let genrePromise = upsertDbCall(connection, "SELECT * FROM Genres WHERE Genre = ?",
        [music.Metadata.Genre || ""], "INSERT INTO Genres (Genre) VALUES (?)");

      let categoryPromise = upsertDbCall(connection, "SELECT * FROM Categories WHERE Category = ?",
        [music.Metadata.Category || ""], "INSERT INTO Categories (Category) VALUES (?)");

      let producerPromise = upsertDbCall(connection, "SELECT * FROM Producers WHERE Producer = ?",
        [music.Metadata.Producer || ""], "INSERT INTO Producers (Producer) VALUES (?)");

      let coArtistPromise = upsertDbCall(connection, "SELECT * FROM Artists WHERE Artist = ?",
        [music.Metadata.CoArtist || ""], "INSERT INTO Artists (Artist) VALUES (?)");

      let writerPromise = upsertDbCall(connection, "SELECT * FROM Writers WHERE Writer = ?",
        [music.Metadata.Writers || ""], "INSERT INTO Writers (Writer) VALUES (?)");

      let recordLabelPromise = upsertDbCall(connection, "SELECT * FROM RecordLabels WHERE RecordLabel = ?",
        [music.Metadata.RecordLabel || ""], "INSERT INTO RecordLabels (RecordLabel) VALUES (?)");

      let musicPromise = dbCall(connection, "INSERT INTO Music (YoutubeLink) VALUES (?)", [music.YoutubeLink]);
      let musicResult;

      [musicResult, albumID, artistID, genreID, categoryID, producerID, coArtistID, writerID, recordLabelID] =
        await Promise.all([musicPromise, albumPromise, artistPromise, genrePromise, categoryPromise, producerPromise, coArtistPromise, writerPromise, recordLabelPromise]);
      musicID = musicResult.insertId;
      //#endregion

      //#region dependent data
      // step 2
      let metaData = await dbCall(connection,
        `INSERT INTO MetaData 
        (Title, ArtistID, ReleaseDate, GenreID, CategoryID, ProducerID, Co_artistID, AlbumID, RecordLabelID, WritersID, SongDuration) 
        VALUES 
        ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          music.Metadata.Title || "",
          artistID,
          music.Metadata.ReleaseDate || "",
          genreID,
          categoryID,
          producerID,
          coArtistID,
          albumID,
          recordLabelID,
          writerID,
          music.Metadata.SongDuration,
        ]);
      let metadataID = metaData.insertId;

      // step 3
      let metaDataToMusicPromise = dbCall(connection, "INSERT INTO MetaDataToMusic (MetaDataID, MusicID) VALUES (?, ?)",
        [metadataID, musicID]);

      // step 4
      let musicStoragePromise = dbCall(connection, "INSERT INTO MusicStorage (MusicID, FilePath, ThumbnailPath) VALUES (?, ?, ?)",
        [musicID, music.FilePath || "", music.Metadata.Thumbnail || ""]);

      // step 5
      let musicLogPromise = dbCall(connection, "INSERT INTO MusicLog (MusicID, Event, Time) VALUES (?, 'Created', NOW())",
        [musicID]);

      await Promise.all([metaDataToMusicPromise, musicStoragePromise, musicLogPromise]);
      //#endregion

      console.log("Music saved: ", musicID);
      pool.releaseConnection(connection);
    });
  },
  isLinkNew: function (pool, videoId) {

    return new Promise(function (resolve, reject) {
      pool.getConnection(async function (err, connection) {
        if (err) {
          reject(new error(err.code));
          return;
        }

        let music = await dbCall(connection, "SELECT * FROM Music WHERE YoutubeLink = ?", [videoId]);
        pool.releaseConnection(connection);
        if (music.length == 0) {
          console.log("This is a new link!");
          resolve(true);
          return;
        }
        else {
          console.log("This is NOT a new link!");
          resolve(false);
          return;
        }
      });
    });
  },
  getDeltaUpdates: function (pool, timestamp) {

    return new Promise(function (resolve, reject) {
      pool.getConnection(async function (err, connection) {
        if (err) {
          reject(new error(err.code));
        }

        let deltaUpdates = await dbCall(connection, `
        SELECT
          MusicStorage.ThumbnailPath, 
          MetaData.Title, 
          Artists.Artist, 
          MetaData.ReleaseDate, 
          Genres.Genre, 
          Categories.Category, 
          Albums.Album, 
          Writers.Writer, 
          MetaData.SongDuration,
          Producers.Producer, 
          Co_Artist.Artist as CoArtist, 
          RecordLabels.RecordLabel, 
          Music.ID, 
          Music.YoutubeLink, 
          MusicStorage.FilePath
        
        FROM MusicLog 
          join Music on MusicLog.MusicID = Music.ID
          join MusicStorage on MusicStorage.MusicID = Music.ID
          join MetaDataToMusic on MetaDataToMusic.MusicID = Music.ID
          join MetaData on MetaDataToMusic.MetaDataID = MetaData.ID
          join Artists on MetaData.ArtistID = Artists.ID
          join Genres on MetaData.GenreID = Genres.ID
          join Albums on MetaData.AlbumID = Albums.ID
          join Categories on MetaData.CategoryID = Categories.ID
          join Producers on MetaData.ProducerID = Producers.ID
          join Artists as Co_Artist on MetaData.Co_artistID = Co_Artist.ID
          join RecordLabels on MetaData.RecordLabelID = RecordLabels.ID
          join Writers on MetaData.WritersID = Writers.ID
        WHERE MusicLog.Time > ?
        `, [timestamp]);

        let result = [];

        deltaUpdates.forEach(dbSong => {
          let song = utils.musicObjectFromDB(dbSong);
          result.push(song);
        });

        pool.releaseConnection(connection);
        resolve(result);
        return;
      });
    });
  },
  getMusic: function (pool, musicId) {

    return new Promise(function (resolve, reject) {
      pool.getConnection(async function (err, connection) {
        if (err) {
          reject(new error(err.code));
          return;
        }

        let music = await dbCall(connection, `
        SELECT
          MusicStorage.ThumbnailPath, 
          MetaData.Title, 
          Artists.Artist, 
          MetaData.ReleaseDate, 
          Genres.Genre, 
          Categories.Category, 
          Albums.Album, 
          Writers.Writer, 
          MetaData.SongDuration,
          Producers.Producer, 
          Co_Artist.Artist as CoArtist, 
          RecordLabels.RecordLabel, 
          Music.ID, 
          Music.YoutubeLink, 
          MusicStorage.FilePath
          
        FROM Music          
          left join MusicLog on Music.ID = MusicLog.MusicID
          left join MusicStorage on MusicStorage.MusicID = Music.ID
          left join MetaDataToMusic on Music.ID = MetaDataToMusic.MusicID
          left join MetaData on MetaDataToMusic.MetaDataID = MetaData.ID
          left join Artists on MetaData.ArtistID = Artists.ID
          left join Genres on MetaData.GenreID = Genres.ID
          left join Albums on MetaData.AlbumID = Albums.ID
          left join Categories on MetaData.CategoryID = Categories.ID
          left join Producers on MetaData.ProducerID = Producers.ID
          left join Artists as Co_Artist on MetaData.Co_artistID = Co_Artist.ID
          left join RecordLabels on MetaData.RecordLabelID = RecordLabels.ID
          left join Writers on Writers.ID = MetaData.WritersID
        WHERE Music.ID = ?
        `, [musicId]);

        pool.releaseConnection(connection);
        if (music.length == 0) {
          reject(new error("Unknown ID"));
          return;
        }
        else {
          let dbSong = music[0];
          let result = utils.musicObjectFromDB(dbSong);
          resolve(result);
          return;
        }
      });
    });
  }
};

/**
 * Calls the database
 */
async function dbCall(connection, sql, args) {

  let res;
  await connection.promise()
    .query(sql, args)
    .then(([result]) => {
      res = result;
    })
    .catch(er => console.log("dbCall error: ", er));
  return res;
}

/**
 * Makes upsert calls to the database
 */
async function upsertDbCall(connection, selectSql, args, insertSql) {

  // select existing
  let results = await dbCall(connection, selectSql, args);
  if (results.length == 0) {
    // nothing found, insert new
    let result = await dbCall(connection, insertSql, args);
    return (result.insertId);
  }
  else {
    // return existing
    return (results[0].ID);
  }
}
