const ImageKit = require('imageKit');
const { v4: uuidv4 } = require('uuid')

const imageKit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});


async function uploadImage({ buffer, filename, folder = '/products'}){
    const res = await imageKit.upload({
        file:buffer,
        filename:uuidv4(),
        folder
    });

    return{
        url:res.url,
        thumbnail: res.thumbnailUrl || res.url,
        id: res.fileId,
    };
}

module.exports = { imageKit, uploadImage };