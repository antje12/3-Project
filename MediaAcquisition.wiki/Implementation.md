## 5.1 Node server
The microservice is implemented via an express Node.js server, exposing the following endpoints to the rest of the system:
-	GET /getMetadata
-	POST /saveMusic
-	GET /getDeltaUpdates
-	GET /getMusic

The first endpoint is for scanning a supplied YouTube link and getting its corresponding metadata for the clients to edit. After the clients have edited the metadata, the second endpoint is used to save the edited metadata and download the corresponding MP3 file to the system.

The third and fourth endpoints are used to get all the added music/metadata since a specific point in time, and to get all metadata related to a specific music id, respectively. Through these endpoints, other services can get enough data to either create a music index optimized for searching, or get data related to a song that the client wants to play in the music player. These endpoints represent the entrance to the business layer, which handles the processing of requests and in turn, uses the persistence layer for long-term storage of the data model.

The business layer is where this data processing is happening. This layer consists of the server itself and an apiBroker. The server component is responsible for defining the available endpoints and handling HTTP requests from the clients. These requests are then processed by the server component which delegates some of the work to the apiBroker. The apiBroker is the system component that is responsible for gathering the metadata related to the YouTube link supplied by the clients. To do this, the component calls various external APIs to gather all the related metadata and structure it in a way that is usable by the rest of the system. When the data has been gathered, processed, and possibly changed by the client, the system is ready to store it via the persistence layer:

[link to metadata fetcher](https://gitlab.sdu.dk/semester-project-e2020/team-09-media-acquisition/template/-/blob/master/server/javascript/apiBroker.js#L8)

The persistence layer is primarily responsible for transforming the data and files into a format suitable for long-term storage. The dbBroker component contains functions to cover data creation and reading from long-term storage, i.e. only half of the CRUD functions. The data-reads are used, to make sure that a song does not already exist in the system when a client tries to add it, and also to return data for consumption by the other clients:

[link to isLinkNew()](https://gitlab.sdu.dk/semester-project-e2020/team-09-media-acquisition/template/-/blob/master/server/javascript/dbBroker.js#L97)

To encapsulate and reuse the code, which calls the database, a helper function called dbCall() was created. This function creates a promise representing the request to the database, which is then awaited before returning the response data. If anything goes wrong, an error is logged for further inspection:

[link to dbCall()](https://gitlab.sdu.dk/semester-project-e2020/team-09-media-acquisition/template/-/blob/master/server/javascript/dbBroker.js#L238)

The insert-functionality is used for inserting new music and all related metadata into the database. To limit how much data is stored in the database, a series of “upsert” calls are used to insert values that could be shared between music, like “Artists”. This way each artist will only exist in the database once, and every song by that specific artist will have a relation to it. In this way the database is normalized by exterminating duplicated data:

[link to "upsert" insertions](https://gitlab.sdu.dk/semester-project-e2020/team-09-media-acquisition/template/-/blob/master/server/javascript/dbBroker.js#L24)

All these calls to insert new, or get the id of existing data, are resolved asynchronously to decrease the time taken before the metadata itself can be inserted. Afterward, the music and shared data have been inserted, the metadata itself can then be inserted into the database with relations to the remaining data:

[link to metadata insert query](https://gitlab.sdu.dk/semester-project-e2020/team-09-media-acquisition/template/-/blob/master/server/javascript/dbBroker.js#L58)

Another helper function, called upsertDbCall(), has been created to encapsulate the so-called “upsert” function, that either inserts a new value or gets the ID of the existing value from the database:

[link to upsertDbCall()](https://gitlab.sdu.dk/semester-project-e2020/team-09-media-acquisition/template/-/blob/master/server/javascript/dbBroker.js#L253)

The fileBroker component is responsible for downloading the music file from YouTube, converting it into the desired MP3 format, and then saving it in an AWS S3 bucket for long term storage. To do this an external API, youtube-mp3-downloader, is used to get the music file from YouTube, and then the server itself converts this file to the MP3 format using a command-line tool called FFmpeg. This is bundled together via an NPM package which calls the API and then accesses the local installation of FFmpeg. After the file is downloaded and converted, it is then sent to the AWS S3 bucket as a stream:

[link to file downloader](https://gitlab.sdu.dk/semester-project-e2020/team-09-media-acquisition/template/-/blob/master/server/javascript/fileBroker.js#L42)

### 5.1.1 AWS bucket
Amazon Simple Storage Service (AWS S3) is a kind of fileserver hosted as a service in the Kubernetes cluster. It is based on resource folders called buckets, wherein files can be stored in the same manner as they are in the local file system. To access the bucket, a specific user ID and password must be supplied together with the S3 host destination and the specific bucket name. Given this information, the file is then sent to the fileserver as a data stream overwriting any files already on the server with the same file name. It should be noted that with the current Kubernetes service setup it is required to set the s3ForcePathStyle to true, which forces the requests to take the following format; http://{host}/{bucket}/{key}, which matches the service endpoint:

[link to S3 connection](https://gitlab.sdu.dk/semester-project-e2020/team-09-media-acquisition/template/-/blob/master/server/javascript/fileBroker.js#L26)

[link to S3 file transfer](https://gitlab.sdu.dk/semester-project-e2020/team-09-media-acquisition/template/-/blob/master/server/javascript/fileBroker.js#L64)

## 5.2 Database
The database is implemented as a MySQL relational database. The database structure is defined in an init.sql file, which is used to build the database when the file is run through the docker image initialization process. To add room for future scalability the IDs are defined as "BIGINT UNSIGNED" which prevents negative values in the database and allows up to (2^64)-1 possible values. Using "NVARCHAR" instead of "VARCHAR" enables saving strings in the Unicode format instead of ASCII, which enhances the kind of characters that can be used in the metadata. This also lets the system avoid encoding and decoding the strings when reading or writing from/to the database, which gives a small boost in performance and data quality: 

[link to init.sql](https://gitlab.sdu.dk/semester-project-e2020/team-09-media-acquisition/template/-/blob/master/database/init.sql#L1)

Through normalization, most tables in the database have a simple construction, which consists only of few elements. Each entity contains a unique ID as Primary Keys, and their own specific data, like a song title or a YouTube link. These are then combined through a series of joins when music is read from the database, to form the music object that should be returned to the clients: 

[link to select query](https://gitlab.sdu.dk/semester-project-e2020/team-09-media-acquisition/template/-/blob/master/server/javascript/dbBroker.js#L185)

## 5.3 External APIs
A couple of external APIs has been used to get music and metadata from YouTube. YouTube has an official API that can be used to get some of the desired metadata, but not enough to satisfy the requirements. A third party API called "ytdl-core" was used to get most of the metadata, which it gets from crawling YouTube's music platform; https://music.youtube.com/. However, YouTubes API is still used to get the music title, the song duration, and the genres as a fallback, if this information is not available through ytdl-core. These genres are used to detect whether the video contains music, as well as storing the music genre for enhanced searchability. Another way to detect if a video contains music, is through the upload-category of the video which ytdl-core API can get. To download the music to the server for further conversion and long-term storage a third API called "youtube-mp3-downloader" is used. This API downloads the MP4 video files from YouTube and uses a local installation of FFmpeg to convert the files into MP3 before saving them to the server.

### 5.3.1 Topic and Genre
A helper function called “GetGenreData” was implemented to detect if a certain YouTube video contains music. YouTube’s API returns what is called topic details, which contains the genre of music, such as “hip hop, rock, music” but formatted as an array of Wikipedia links, i.e. "https://en.wikipedia.org/wiki/Hip_hop". To save the genres in a better format, the string is first split to remove the first 30 characters of each link; "https://en.wikipedia.org/wiki/" and then replace possible underscores with whitespace; "Hip_hop" becomes "Hip hop". 

Furthermore, topic details usually contain the genre keyword “music” if the link is a music video. This is useful in cases where the uploader of the song did not set the category of the video to “music” during upload. In these cases, the system will still allow the video if the topic details contain the music keyword. To accommodate this, JavaScript’s inbuilt “filter” function is used, which can filter out things in an array, in combination with a filterFunc() function written to recognize the music keyword. If the genre contains “Music”, then it is filtered out, since "music" is not a real genre and would only pollute the search index. Before removing the genre, a variable called “isTopicMusic” is set equal to true, to indicate that the link was indeed music. This is used in the metadata class in the function IsMusic(), which checks if the video or metadata contains music. The function returns true, if the category of the video is “music” or if the topic details contained the music keyword. This way, links that do not contain music can be rejected before upload:

[link to getGenreData()](https://gitlab.sdu.dk/semester-project-e2020/team-09-media-acquisition/template/-/blob/master/server/javascript/apiBroker.js#L86)

[link to isMusic()](https://gitlab.sdu.dk/semester-project-e2020/team-09-media-acquisition/template/-/blob/master/server/javascript/classes/metadata.js#L40)
