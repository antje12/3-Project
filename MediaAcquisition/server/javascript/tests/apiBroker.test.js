/* eslint no-use-before-define: 0 */  // --> OFF
const apiBroker = require('../apiBroker.js');
const Metadata = require('../classes/metadata.js');

// eslint-disable-next-line no-undef
test('checking if returning a metadata object', async () => {
    await apiBroker.getMetaDataAsync('www.youtube.com/watch?v=UQn-7GCh2r0').then(async data => {
        // eslint-disable-next-line no-undef
        await expect(data instanceof (Metadata)).toBeTruthy();
    });
});

// eslint-disable-next-line no-undef
test('returning a corresponding metadata object',async () => {

    const expMetaData = [
        { title: 'Took Her To The O' },
        { artist: 'King Von' },
        { album: 'Levon James' }
    ];
    await apiBroker.getMetaDataAsync('https://youtu.be/hzt31eJTGxo').then(async data => {
        const actMetaData = [
            { title: data.Title },
            { artist: data.Artist },
            { album: data.Album }
        ];
        // eslint-disable-next-line no-undef
        await expect(actMetaData).toEqual(expMetaData);
    });
});