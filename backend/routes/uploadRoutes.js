const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
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

module.exports = router;
