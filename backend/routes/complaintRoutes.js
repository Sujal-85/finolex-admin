const express = require('express');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const Student = require('../models/Student'); // Imported Student model for fallback
const auth = require('../middleware/auth');
const logActivity = require('../utils/activityLogger');
const router = express.Router();

const mongoose = require('mongoose');

router.get('/', auth, async (req, res) => {
    try {
        const { studentId } = req.query;
        // console.log("DEBUG: GET /complaints called");

        const query = {};
        if (studentId) {
            try {
                query.studentId = new mongoose.Types.ObjectId(studentId);
            } catch (err) {
                return res.status(400).send("Invalid Student ID format");
            }
        }

        let complaints = await Complaint.find(query)
            .populate('studentId', 'name profileImage rollNo hostelDetails')
            .sort({ createdAt: -1 });

        // FALLBACK SEARCH Strategy
        // If searching by specific ID returns 0 results, check if we can match by Name.
        // This helps recover complaints if a student was deleted and re-created (orphaned complaints).
        if (complaints.length === 0 && studentId) {
            try {
                const student = await Student.findById(studentId);
                if (student) {
                    // console.log(`Fallback: Searching complaints for name '${student.name}'`);
                    // 1. Try Exact Match
                    let fallbackComplaints = await Complaint.find({ studentName: student.name })
                        .populate('studentId', 'name profileImage rollNo hostelDetails')
                        .sort({ createdAt: -1 });

                    // 2. Try Partial/Fuzzy Match if exact match fails
                    if (fallbackComplaints.length === 0) {
                        try {
                            const nameParts = student.name.split(" ");
                            if (nameParts.length > 0) {
                                // Search for first name (case insensitive)
                                const firstNameRegex = new RegExp(nameParts[0], 'i');
                                fallbackComplaints = await Complaint.find({ studentName: { $regex: firstNameRegex } })
                                    .populate('studentId', 'name profileImage rollNo hostelDetails')
                                    .sort({ createdAt: -1 });
                            }
                        } catch (err) {
                            console.error("Fuzzy search failed:", err);
                        }
                    }

                    if (fallbackComplaints.length > 0) {
                        complaints = fallbackComplaints;
                        // console.log(`Fallback: Found ${complaints.length} complaints by name.`);
                    }
                }
            } catch (e) {
                console.error("Fallback search failed:", e);
            }
        }

        const formattedComplaints = complaints.map(c => {
            const complaintObj = c.toObject();

            // Populated student mismatch handling:
            // If we found complaints by NAME, the studentId field might be the OLD deleted ID.
            // Populating it would return null. So we handle that here.

            // If matched by Name fallback, studentId might be null or old.
            // But we know 'student' from our fallback check (or the one we are finding).
            // Let's rely on the text fields first if populate failed.

            // Always use populated student name if available
            if (complaintObj.studentId && complaintObj.studentId.name) {
                complaintObj.studentName = complaintObj.studentId.name;
            }

            // Add profile picture and other details
            if (complaintObj.studentId) {
                if (complaintObj.studentId.profileImage) {
                    complaintObj.studentProfilePicture = complaintObj.studentId.profileImage;
                } else if (complaintObj.studentId.profilePicture) {
                    complaintObj.studentProfilePicture = complaintObj.studentId.profilePicture;
                }

                if (complaintObj.images && complaintObj.images.length > 0 && !complaintObj.image) {
                    complaintObj.image = complaintObj.images[0];
                }

                complaintObj.studentRollNumber = complaintObj.studentId.rollNo;
                if (complaintObj.studentId.hostelDetails) {
                    complaintObj.studentHostel = complaintObj.studentId.hostelDetails.hostelName;
                    complaintObj.studentRoom = complaintObj.studentId.hostelDetails.roomNo;
                }
            }

            // Final properties default
            if (!complaintObj.studentName) complaintObj.studentName = "Unknown Student";
            if (!complaintObj.subject) complaintObj.subject = "No Subject";
            if (!complaintObj.description) complaintObj.description = "No description";
            if (!complaintObj.category) complaintObj.category = "other";
            if (!complaintObj.priority) complaintObj.priority = "Medium";
            if (!complaintObj.status) complaintObj.status = "Pending";

            return complaintObj;
        });

        res.send(formattedComplaints);
    } catch (error) {
        console.error("Error fetching complaints:", error);
        res.status(500).send(error);
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const complaint = new Complaint(req.body);
        await complaint.save();

        // Create notification
        await Notification.create({
            title: 'New Complaint Logged',
            message: `${complaint.subject} - ${complaint.priority} Priority`,
            type: 'complaint',
            recipient: complaint.studentId
        });

        await logActivity({
            user: req.user.name || 'Admin',
            action: 'Created Complaint',
            module: 'complaints',
            details: `New complaint logged: ${complaint.subject}`,
            ipAddress: req.ip
        });

        res.status(201).send(complaint);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.patch('/:id', auth, async (req, res) => {
    try {
        const complaint = await Complaint.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!complaint) return res.status(404).send();

        if (req.body.status) {
            await logActivity({
                user: req.user.name || 'Admin',
                action: 'Updated Complaint',
                module: 'complaints',
                details: `Complaint status updated to ${req.body.status}`,
                ipAddress: req.ip
            });
        }

        res.send(complaint);
    } catch (error) {
        res.status(400).send(error);
    }
});

module.exports = router;
