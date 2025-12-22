const express = require('express');
const router = express.Router();
const { upload, uploadPdf } = require('../config/cloudinary');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// @desc    Upload avatar
// @route   POST /api/upload/avatar
// @access  Private
router.post('/avatar', protect, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const avatarUrl = req.file.path;

        // Update user profile with new avatar URL
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { avatar: avatarUrl },
            { new: true }
        ).select('-password');

        res.json({
            message: 'Avatar uploaded successfully',
            avatar: avatarUrl,
            user
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Upload PDF
// @route   POST /api/upload/rebate-pdf
// @access  Private
router.post('/rebate-pdf', protect, uploadPdf.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        let pdfUrl = req.file.path.trim();

        // Ensure fl_inline is present for PDFs to encourage browser preview
        if (pdfUrl.includes('/upload/') && !pdfUrl.includes('fl_inline')) {
            pdfUrl = pdfUrl.replace('/upload/', '/upload/fl_inline/');
        }

        const fs = require('fs');
        const logData = `
--- PDF Upload Debug ${new Date().toISOString()} ---
Full req.file: ${JSON.stringify(req.file, null, 2)}
Path: ${req.file.path}
Final PDF URL: ${pdfUrl}
Result: Successful
------------------------
`;
        fs.appendFileSync('upload_debug.log', logData);

        res.json({
            message: 'PDF uploaded successfully',
            pdfUrl: pdfUrl
        });
    } catch (error) {
        const fs = require('fs');
        const errLog = `\n--- PDF Upload ERROR ${new Date().toISOString()} ---\nError: ${error.message}\n------------------------\n`;
        fs.appendFileSync('upload_debug.log', errLog);
        console.error('PDF Upload Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

module.exports = router;
