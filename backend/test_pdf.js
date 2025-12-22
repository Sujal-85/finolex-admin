const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUpload() {
    try {
        const formData = new FormData();
        // Create a dummy PDF content
        const dummyPdfPath = path.join(__dirname, 'dummy.pdf');
        fs.writeFileSync(dummyPdfPath, '%PDF-1.4\n1 0 obj\n<< /Title (Test) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');

        formData.append('pdf', fs.createReadStream(dummyPdfPath));

        console.log('Attempting upload to http://localhost:5000/api/upload/rebate-pdf...');

        // We need a token because the route is protected
        // For testing, I'll temporarily disable protection or use a known token if I can find one.
        // Actually, I'll just check the backend logs for previous attempts if possible.

        // Wait, I'll just check the implementation of uploadPdf in cloudinary.js
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}
// testUpload();
