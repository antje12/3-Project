let ytLink;
let metaObject;

// eslint-disable-next-line require-jsdoc, no-unused-vars
function uploadClicked(link) {
    getMetadata(link);
    ytLink = link
    showMetaDataFields();
}

// eslint-disable-next-line require-jsdoc
function getMetadata(link) {
    console.log("entered");
    fetch("http://localhost:8080/getMetadata?youtubeLink=" + link, {
        method: "GET",
    })
        .then(response => response.json())
        .then(data => {
            if (data.ErrorMessage != undefined) {
                console.log(data.ErrorMessage)
                alert(data.ErrorMessage);
                location.reload();
            }
            else {
                console.log(data.Title + " | LINK: " + link);
                metaObject = data
                setMetadata(data)
            }
        })
}

// eslint-disable-next-line require-jsdoc
function showMetaDataFields() {
    document.getElementById("meta-form").style.display = "block";
    document.getElementById('link').setAttribute("readonly", "true");
}

// eslint-disable-next-line require-jsdoc
function setMetadata(data) {
    document.getElementById('Title').value = data.Title
    document.getElementById('Artist').value = data.Artist
    document.getElementById('ReleaseDate').value = data.ReleaseDate
    document.getElementById('Genre').value = data.Genre
    document.getElementById('Writers').value = data.Writers
    document.getElementById('Album').value = data.Album
    document.getElementById('Producer').value = data.Producer
    document.getElementById('CoArtist').value = data.CoArtist
    document.getElementById('RecordLabel').value = data.RecordLabel
    document.getElementById('thumbnailID').src = data.Thumbnail
    document.getElementById('thumbnailID').style.display = 'block'
}

// eslint-disable-next-line require-jsdoc, no-unused-vars
function formSubmit() {
    metaObject.Title = document.getElementById('Title').value
    metaObject.Artist = document.getElementById('Artist').value
    metaObject.ReleaseDate = document.getElementById('ReleaseDate').value
    metaObject.Genre = document.getElementById('Genre').value
    metaObject.Writers = document.getElementById('Writers').value
    metaObject.Album = document.getElementById('Album').value
    metaObject.Producer = document.getElementById('Producer').value
    metaObject.CoArtist = document.getElementById('CoArtist').value
    metaObject.RecordLabel = document.getElementById('RecordLabel').value
    fetch("http://localhost:8080/saveMusic?youtubeLink=" + ytLink, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(metaObject)
    })
        .then(response => response.json())
        .then(data => {
            if (data.ErrorMessage != undefined) {
                console.log(data.ErrorMessage)
                alert(data.ErrorMessage);
                location.reload();
            }
            else {
                alert("Music added");
                location.reload();
            }
        })
}
