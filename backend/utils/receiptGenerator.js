const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// Assets Paths (Adjust based on where backend runs relative to public folder)
// Backend is in /backend. Public is in /public (root/public).
// So path is ../public/filename
const LOGO_PATH = path.join(__dirname, '../../public/playstore-icon.png');
const SIGNATURE_PATH = path.join(__dirname, '../../public/manager_signature.png');

const generateReceipt = (transaction, student) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });

        doc.on('error', (err) => {
            reject(err);
        });

        // --- Colors ---
        const PRIMARY_BLUE = '#1a56db'; // Approx blue from image
        const TEXT_GREY = '#6b7280';
        const TEXT_BLACK = '#111827';
        const SUCCESS_GREEN = '#16a34a';

        // --- Header ---
        // Logo
        if (fs.existsSync(LOGO_PATH)) {
            doc.image(LOGO_PATH, 50, 45, { width: 60 });
        } else {
            // Fallback if logo missing
            doc.circle(80, 75, 30).fill('#eee');
        }

        // Title Section (Left, next to logo)
        const headerTextX = 120;
        const headerY = 55;

        doc.font('Helvetica-Bold').fontSize(20).fillColor(PRIMARY_BLUE)
            .text('Prasanna Caterers', headerTextX, headerY);

        doc.font('Helvetica').fontSize(10).fillColor(TEXT_GREY)
            .text('Finolex Academy of Management and Technology', headerTextX, headerY + 25);

        // Receipt Label (Right)
        doc.font('Helvetica-Bold').fontSize(18).fillColor('#9ca3af') // Light grey
            .text('RECEIPT', 400, headerY, { align: 'right' });

        doc.font('Helvetica-Bold').fontSize(10).fillColor(TEXT_GREY)
            .text(`#${transaction._id.toString().slice(-8).toUpperCase()}`, 400, headerY + 25, { align: 'right' });

        // Divider Line
        doc.moveDown(4); // Adjust based on logo height
        const lineY = 130;
        doc.moveTo(50, lineY).lineTo(545, lineY).strokeColor('#e5e7eb').lineWidth(1).stroke();

        // --- Body Info ---
        const bodyY = lineY + 30;

        // Left: Received From
        doc.font('Helvetica').fontSize(9).fillColor(TEXT_GREY)
            .text('Received From', 50, bodyY);

        doc.font('Helvetica-Bold').fontSize(12).fillColor(TEXT_BLACK)
            .text(student.name, 50, bodyY + 15);

        doc.font('Helvetica').fontSize(10).fillColor(TEXT_GREY)
            .text(student.email || student.rollNumber || 'N/A', 50, bodyY + 30);

        doc.text(student.hostel ? `${student.hostel} Hostel` : 'General Student', 50, bodyY + 45);

        // Right: Payment Details
        doc.font('Helvetica').fontSize(9).fillColor(TEXT_GREY)
            .text('Payment Details', 400, bodyY, { align: 'right' });

        const dateStr = new Date(transaction.date || Date.now()).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        doc.font('Helvetica-Bold').fontSize(10).fillColor(TEXT_BLACK)
            .text(dateStr, 400, bodyY + 15, { align: 'right' });

        doc.font('Helvetica').fontSize(10).fillColor(TEXT_GREY)
            .text(transaction.method || 'Online', 400, bodyY + 30, { align: 'right' });


        // --- Amount Box ---
        const boxTop = bodyY + 80;
        const boxHeight = 60;

        // Background Box
        doc.roundedRect(50, boxTop, 495, boxHeight, 8)
            .fillColor('#f8f9fa').fill(); // Light grey bg

        // "Total Amount Paid"
        doc.fillColor(TEXT_BLACK).font('Helvetica-Bold').fontSize(12)
            .text('Total Amount Paid', 70, boxTop + 22);

        // Amount Value
        doc.fillColor(SUCCESS_GREEN).font('Helvetica-Bold').fontSize(20)
            .text(`INR ${transaction.amount.toFixed(2)}`, 400, boxTop + 18, { align: 'right' });


        // --- Footer / Signature ---
        const footerY = boxTop + 100;

        // Transaction Ref (Small text)
        doc.font('Helvetica').fontSize(9).fillColor(TEXT_GREY)
            .text(`Transaction Ref: ${transaction.transactionId || transaction._id}`, 50, footerY);

        // PAID Stamp (Mocking a stamp look)
        // PAID Stamp
        doc.save();
        // doc.rotate(-10, { origin: [80, footerY + 80] }); // Removed rotation
        doc.roundedRect(50, footerY + 50, 100, 40, 4)
            .strokeColor(SUCCESS_GREEN).lineWidth(3).stroke();
        doc.font('Helvetica-Bold').fontSize(20).fillColor(SUCCESS_GREEN)
            .text('PAID', 50, footerY + 60, { width: 100, align: 'center' });
        doc.restore();

        // Manager Signature
        const signatureY = footerY + 40;
        if (fs.existsSync(SIGNATURE_PATH)) {
            doc.image(SIGNATURE_PATH, 400, signatureY, { width: 100 });
        }

        // Manager Name Line
        const nameLineY = signatureY + 50; // below signature
        doc.moveTo(400, nameLineY).lineTo(545, nameLineY).strokeColor(TEXT_BLACK).lineWidth(1).stroke();

        doc.font('Helvetica-Bold').fontSize(10).fillColor(TEXT_BLACK)
            .text('Mr. Sandeep Tambe', 400, nameLineY + 10, { align: 'right', width: 145 });

        doc.font('Helvetica').fontSize(9).fillColor(TEXT_GREY)
            .text('Manager (Prasanna Caterers)', 400, nameLineY + 22, { align: 'right', width: 145 });


        // Bottom Center Text
        doc.font('Helvetica-Oblique').fontSize(8).fillColor('#d1d5db')
            .text('This is a computer generated receipt.', 50, 750, { align: 'center', width: 500 });

        doc.end();
    });
};

module.exports = { generateReceipt };
