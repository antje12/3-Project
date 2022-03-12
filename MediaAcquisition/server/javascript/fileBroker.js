const fs = require('fs');
const utils = require('./utils');
const AWS = require('aws-sdk');
// https://www.npmjs.com/package/youtube-mp3-downloader
const YoutubeMp3Downloader = require("youtube-mp3-downloader");

const error = require('./classes/error.js');

// Local storage setup
const FOLDER_NAME = "music";

// AWS S3 bucket setup
const BUCKET_NAME = 'music-bucket';
const ID = 'i04lyk6zckw9ezwhaotevhsac1puly2s';
const SECRET = 'b8107i820gnaetd9hh3eszbqssq1n2bk';

module.exports = {
    saveFile: function (req, link) {
        let vidId = utils.getVideoId(link);
        let fileName = vidId + ".mp3";

        if (!fs.existsSync(FOLDER_NAME)) {
            fs.mkdirSync(FOLDER_NAME);
        }

        let endpoint = process.env.NODE_ENV == "live" ?
            "http://minio:9000/" :
            "http://localhost:9000/";

        let s3 = new AWS.S3({
            accessKeyId: ID,
            secretAccessKey: SECRET,
            endpoint: endpoint,
            // needed with minio
            s3ForcePathStyle: true
        });

        var start = new Date()

        return new Promise(function (resolve, reject) {

            //Configure YoutubeMp3Downloader with your settings
            let mp3Downloader = new YoutubeMp3Downloader({
                "ffmpegPath": "/usr/bin/ffmpeg",        // FFmpeg binary location
                "outputPath": "music",                  // Output file location (default: the home directory)
                "youtubeVideoQuality": "highestaudio",  // Desired video quality (default: highestaudio)
                "queueParallelism": 1,                  // Download parallelism (default: 1)
                "progressTimeout": 1000,                // Interval in ms for the progress reports (default: 1000)
                "allowWebm": false                      // Enable download from WebM sources (default: false)
            });

            //Download video and save as MP3 file
            mp3Downloader.download(vidId, fileName);
            mp3Downloader.on("finished", function () {
                utils.logTime(start, "File download time");

                const fileContent = fs.readFileSync(FOLDER_NAME + "/" + fileName);
                var params = {
                    Bucket: BUCKET_NAME,
                    Key: fileName,
                    Body: fileContent
                };

                // send to S3 bucket               
                s3.putObject(params, function (err) {
                    if (err) {
                        console.log("S3 error: ", err);
                        reject(new error(err));
                        return;
                    }
                    else {
                        console.log("File uploaded to S3: " + fileName);
                        utils.logTime(start, "File download + upload time");
                        // delete local file
                        fs.unlinkSync(FOLDER_NAME + "/" + fileName);
                        resolve(BUCKET_NAME + "/" + fileName);
                        return;
                    }
                });
            });
        });
    },
    deleteFile: function () {

    }
};
