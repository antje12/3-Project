const express = require('express');
const morgan = require('morgan');
const utils = require('./utils');
const mysql = require('mysql2');
const fs = require('fs');
const server = express();
server.use(express.json());

// morgan = HTTP request logger middleware for node.js (used by other team)
server.use(morgan('dev'));

//#region brokers
const apiBroker = require('./apiBroker');
const fileBroker = require('./fileBroker');
const dbBroker = require('./dbBroker');
//#endregion

//#region classes
//const user = require('./classes/user.js');
const error = require('./classes/error.js');
//#endregion

//#region frontend files
const html = process.env.NODE_ENV == "live" ?
    fs.readFileSync('frontend/live-index.html') :
    fs.readFileSync('frontend/index.html');

const js = process.env.NODE_ENV == "live" ?
    fs.readFileSync('frontend/javascript/live-frontend.js') :
    fs.readFileSync('frontend/javascript/frontend.js');

const css = fs.readFileSync('frontend/css/styles.css');
//#endregion

//#region general CORS headers
server.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
//#endregion

//#region frontend files served through server
server.get('/', (req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
});

server.get('/frontend.js', (req, res) => {
    res.writeHead(200, { "Content-Type": "text/javascript" });
    res.end(js);
});

server.get('/styles.css', (req, res) => {
    res.writeHead(200, { "Content-Type": "text/css" });
    res.end(css);
});
//#endregion

const pool = mysql.createPool({
    host: process.env.NODE_ENV == "live" ?
        "service02" :
        "localhost",
    user: "root",
    password: "",
    database: "mediaAcquisitionDB",
    port: 3306,
    insecureAuth: true,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

//#region api functions
// curl localhost:8080/getMetadata?youtubeLink=https://www.youtube.com/watch?v=HgzGwKwLmgM
server.get('/getMetadata', async (req, res) => {

    let link = req.query.youtubeLink;
    console.log("GetMetadata called - Got input: ", link)

    if (link == undefined) {
        res.status(400).send(new error("A link is required"))
        return;
    }

    // test if already in system
    let videoId = utils.getVideoId(link);
    dbBroker.isLinkNew(pool, videoId)
        .then(isLinkNew => {
            if (!isLinkNew) {
                res.status(406).send(new error("This video is already in the system"))
                return;
            }
            // get metadata
            getMetaData(link, res);
        })
        .catch(error => {
            // db error
            res.status(406).send(error);
            return;
        });
});

server.post('/saveMusic', (req, res) => {

    let link = req.query.youtubeLink;
    let body = req.body;
    console.log("SaveMusic called - Got input: ", link, body);

    // save the file to server
    fileBroker.saveFile(req, link)
        .then(filePath => {

            // create music object
            let music = utils.musicObjectFromBody(link, body, filePath);

            // save music and meta data to db
            dbBroker.saveMusic(pool, music);

            // return success
            res.send({ message: "Music added" });
        })
        .catch(error => {
            res.status(406).send(error);
            return;
        });
});

// todo: function that takes a timestamp and gets the delta updates from the db
// it then maps these to music objects and returns it all as json
// DB timestamp format: 2020-01-20 11:26:46
// curl localhost:8080/getDeltaUpdates?timestamp=2000-01-30%2012%3A30%3A00
server.get('/getDeltaUpdates', (req, res) => {

    let timestamp = req.query.timestamp;
    console.log("GetDeltaUpdates called - Got input: ", timestamp);

    if (timestamp == undefined) {
        res.status(400).send(new error("A timestamp is required"))
        return;
    }

    // go to db and get data
    dbBroker.getDeltaUpdates(pool, timestamp)
        .then(deltaUpdates => {
            let output = JSON.stringify(deltaUpdates);
            res.set("Content-Type", "application/json");
            res.send(output);
            return;
        })
        .catch(error => {
            // db error
            res.status(406).send(error);
            return;
        });
});

// todo: function that takes a music id and gets the data from the db
// it then maps this to a music object and returns it as json
// curl localhost:8080/getMusic?musicId=1
server.get('/getMusic', (req, res) => {

    let musicId = req.query.musicId;
    console.log("GetMusic called - Got input: ", musicId);

    if (musicId == undefined) {
        res.status(400).send(new error("A musicId is required"))
        return;
    }

    // go to db and get data
    dbBroker.getMusic(pool, musicId)
        .then(music => {
            if (music == undefined) {
                res.status(404).send(new error("No music found"))
                return;
            }
            let output = JSON.stringify(music);
            res.set("Content-Type", "application/json");
            res.send(output);
            return;
        })
        .catch(error => {
            // db error
            res.status(406).send(error);
            return;
        });
});

// general request fallback
server.get('*', (req, res) => {
    res.sendStatus(404)
});
//#endregion

/**
 * Gets metadata from the apiBroker
 */
function getMetaData(link, res) {
    apiBroker.getMetaDataAsync(link)
        .then(metadata => {
            if (metadata instanceof (error)) {
                res.status(406).send(metadata)
                return;
            }

            // test if music
            let isMusic = metadata.isMusic();
            if (isMusic) {
                // return metadata
                let output = JSON.stringify(metadata);
                res.set("Content-Type", "application/json");
                res.send(output);
                return;
            } else {
                // if not, return an error
                res.status(406).send(new error("This video does not contain the music category"));
                return;
            }
        });
}

server.listen(8080, () => console.log("Started server at http://localhost:8080!"));
