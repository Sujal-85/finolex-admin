const axios = require('axios');

async function testUrl() {
    const url = 'https://res.cloudinary.com/duwxtqbkh/image/upload/v1766222915/finolex_rebates/qlr7tfjanxsdtqio21tp.pdf';
    try {
        console.log(`Testing URL: ${url}`);
        const response = await axios.get(url, { responseType: 'stream' });
        console.log('Status:', response.status);
        console.log('Content-Type:', response.headers['content-type']);
        console.log('Content-Length:', response.headers['content-length']);
    } catch (error) {
        if (error.response) {
            console.log('Error Status:', error.response.status);
            console.log('Error Data:', error.response.data);
            // If it's a stream, we might need to read it
        } else {
            console.log('Error:', error.message);
        }
    }
}
testUrl();
