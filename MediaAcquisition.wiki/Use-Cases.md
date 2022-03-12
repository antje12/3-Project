## A.1 Add Music
| Use case: Add Music |
|--------|
| ID: 01 |
| Primary actor: User |
| Secondary actor: |
| Short description: <br> Converts video from external service to mp3 |
| Preconditions: <br> The desired video, exists on the external platform <br> The desired video has to be publicly accessible |
| Main flow: <br> 1) User inserts a link to a video hosted on an external service <br> 2) Metadata & thumbnail is obtained from a music service if available <br> 3) User presses the “upload” button <br> 4) An API converts the given music video, to mp3 format <br> 5) The mp3 file gets uploaded to the platform and the metadata is saved in the system |
| Postconditions: <br> The system has converted the video to mp3 and saved it in the database, without degrading music quality |
| Alternative flow: <br> 2a) User inserts the metadata manually if it isn’t available through the API <br> 4a) If the metadata indicates that the video is not categorized as music, the upload is denied |

## A.2 Delete Music
| Use case: Delete Music |
|--------|
| ID: 02 |
| Primary actor: System Admin |
| Secondary actor: |
| Short description: <br> Ability to delete music from the system |
| Preconditions: <br> The undesired song, is available to the user |
| Main flow:  <br> 1) Admin is presented with a list of songs <br> 2) Admin chooses a song <br> 3) Admin presses on the “delete” button <br> 4) The song file is deleted from the server and it is marked as unavailable in the database |
| Postconditions: <br> The undesired song, is no longer available to the user |
| Alternative flow: <br> 3a) The file has already been deleted by another admin, in the middle of the process |