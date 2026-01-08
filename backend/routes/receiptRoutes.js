const express = require('express');
const router = express.Router();
const { generateReceipt } = require('../utils/receiptGenerator');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const nodemailer = require('nodemailer');
const auth = require('../middleware/auth');
const Student = require('../models/Student');
// Assuming we might need Transaction model if ID is passed, 
// strictly speaking the frontend can pass minimal data, but better to fetch from DB for security.
// For now, let's assume body contains necessary details or we fetch them. 
// Adding Transaction model to be safe.
const mongoose = require('mongoose');

// Configure Cloudinary (Globally handled in server.js usually, but ensuring it's loaded)
// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Helper: Upload Buffer to Cloudinary
const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'receipts',
                resource_type: 'raw', // Use raw for PDF
                format: 'pdf'
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

// @route   POST /api/receipts/generate
// @desc    Generate Receipt PDF and return Cloudinary URL
// @access  Admin
router.post('/generate', auth, async (req, res) => {
    try {
        const { transaction, studentId, action } = req.body; // action: 'download' | 'share'

        // Fetch full student details if needed, or use passed data
        const student = await Student.findById(studentId);
        if (!student) return res.status(404).send({ error: 'Student not found' });

        console.log(`Generating receipt for Transaction ${transaction._id || 'N/A'} (Action: ${action})`);

        // Generate PDF
        const pdfBuffer = await generateReceipt(transaction, student);

        console.log('Streaming PDF directly to client...');
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=receipt_${transaction.transactionId || 'payment'}.pdf`,
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Receipt Generation Error:', error);
        res.status(500).send({ error: 'Failed to generate receipt' });
    }
});

// @route   POST /api/receipts/email
// @desc    Send Receipt URL via Email
// @access  Admin
router.post('/email', auth, async (req, res) => {
    try {
        const { email, url, subject } = req.body;

        if (!email || !url) {
            return res.status(400).send({ error: 'Email and URL are required' });
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: subject || 'Payment Receipt - Finolex Canteen',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Payment Receipt</h2>
                    <p>Dear Student,</p>
                    <p>Please find your payment receipt at the link below:</p>
                    <p><a href="${url}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Download Receipt</a></p>
                    <p>Or copy this link: ${url}</p>
                    <br>
                    <p>Regards,<br>Finolex Canteen Admin</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Receipt emailed to ${email}`);
        res.send({ message: 'Email sent successfully' });

    } catch (error) {
        console.error('Email Sending Error:', error);
        res.status(500).send({ error: 'Failed to send email' });
    }
});

module.exports = router;
