## 7.1 What went well?

### 7.1.1 Quick response times
The system has a quick response time for most of the requests, as seen in the stress test. Even with the fairly low resources given, the system still performs at a reasonable speed, when fetching the music to clients, or returning data for the search engine.

### 7.1.2 Broker architecture
During the development of the system, some of the external APIs stopped working as expected. The solution was to change the API, and thereby the implementation details related to their usage. Given the broker architecture, where all the functionality related to an API is encapsulated in a broker class, it was easy to change the external API and its implementation. As an example, the fileBroker, handling download of the MP3-files, has been changed 3 times without affecting the rest of the system.

## 7.2 What went bad?

### 7.2.1 External APIs performance
The external APIs can at times be slow and unstable, which in turn affects the system as it is heavily reliant upon them. Occasionally it can be experienced that data/songs have a longer time delay before they are pulled down, and occasionally fail altogether. 

The only way to effectively fix this would be to remove the system's reliance on the external APIs and make everything from scratch to properly function independently. Due to time restraints combined with the complexity of implementing this, the group decided to not go down this route at this point in time.

### 7.2.2 External APIs breaking
YouTube is a platform in constant evolution, which results in frequent updates to their API. These updates to their platform also result in updates to the external APIs used to acquire metadata and MP3 files. This has broken the system several times during the development of the project, since some APIs suddenly stop working, or deliver data in a new format than was expected.

To accommodate these changes, the group had to make frequent adjustments to the way the system pulls data from YouTube and the external APIs. As the project draws to a close, and it is required to freeze the source-code, it can not be guaranteed that the system will not break again in the foreseeable future.

At this point in time, the only way to consistently fix this is to periodically update the code to adjust to the changes that are made to YouTube’s API.

### 7.2.3 Sound quality
Regarding requirement R1-6, which deals with the bit rate of the music, the group encountered problems along the way. The requirement states that the music downloaded should have a bitrate of at least 126kbps. First of all, the downloaded sound quality relies on what YouTubes original bitrate was for the music, which can not be inspected. This would be required to give a realistic estimate of a possible decrement of bitrate. Another problem was that YouTube doesn’t supply videos with a single bitrate, but instead uses Adaptive Bit Rate (ABR/ABS). This means that the original video is first sliced into smaller intervals of equal duration, before every part is streamed to the user at a bitrate, matching the current network-quality. This results in the video having several different bitrates in its runtime, which can't be measured. [[7]](/References#7-article-describing-the-adaptive-bitrate-concept)

### 7.2.4 Server pressure
Because there is a finite amount of resources allocated to the service, uploading songs can feel very slow. As shown in the stress test, the resources that are available in Kubernetes play a crucial part in how fast the response time is, when multiple people are using the system at the same time. Realistically the only reliable way to improve upon this with the current setup would be to allocate more resources in Kubernetes, which would lead to faster response times in general. The better solution would be horizontal scaling of the server, which would require a new structure with a load balancer distributing the upload requests between multiple Kubernetes instances.

## 7.3 Future work

### 7.3.1 R2 requirements
The R2 requirements are ideal for further work on the system. They all focus on the administrative part of the system and its data, which was not the main scope in the initial project. The implementation of these requirements would enable editing and deleting music in the system, which would help keep the data model up to a certain quality. During the development of the database, tables have already been set up to accommodate these functionalities, which would ease future implementation.

## 7.4 Conclusion
In conclusion, the product of the project was a microservice build to support the rest of the music player application. This service makes it possible to download music and its corresponding metadata from YouTube, as well as saving it for long term storage. During this process, the YouTube links are filtered to ensure that they contain music and are not already in the system. Following this check, the music is converted to MP3 files and saved on a file server accessible by the rest of the system. The rest of the application can then access the metadata through different endpoints, depending on the amount of data needed. Through various tests, it could be concluded that the chosen subset of requirements was fulfilled and that the system performed well in correlation to response time.