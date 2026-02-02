const express = require('express');
const RentPayment = require('../models/RentPayment');
const Resident = require('../models/Resident');
const auth = require('../middleware/auth');

const router = express.Router();

// Get rent for a specific month
router.get('/', auth, async (req, res) => {
    try {
        const { month, year } = req.query;
        const targetMonth = parseInt(month) || new Date().getMonth() + 1;
        const targetYear = parseInt(year) || new Date().getFullYear();

        // Get all active residents
        const residents = await Resident.find({ pgId: req.pgId, isActive: true })
            .populate({
                path: 'bedId',
                populate: [
                    { path: 'roomId', select: 'name' },
                    { path: 'sectionId', select: 'name' }
                ]
            });

        // Get or create rent payments for each resident
        const rentData = (await Promise.all(residents.map(async (resident) => {
            // Check if resident was active in target month
            const joinDate = new Date(resident.joinDate);
            const joinMonth = joinDate.getMonth() + 1;
            const joinYear = joinDate.getFullYear();

            // Skip rent creation if target month is before join date
            if (targetYear < joinYear || (targetYear === joinYear && targetMonth < joinMonth)) {
                return null; // Don't show rent for this resident
            }

            let rentPayment = await RentPayment.findOne({
                residentId: resident._id,
                month: targetMonth,
                year: targetYear
            });

            // Create rent payment if doesn't exist
            if (!rentPayment) {
                rentPayment = new RentPayment({
                    residentId: resident._id,
                    pgId: req.pgId,
                    month: targetMonth,
                    year: targetYear,
                    amountDue: resident.rentAmount,
                    status: 'pending'
                });
                await rentPayment.save();
            }

            // Check if overdue - only mark overdue if:
            // 1. Current date > due date AND
            // 2. It's not the resident's first month (give them grace period)
            const today = new Date();
            const dueDate = new Date(targetYear, targetMonth - 1, resident.rentDueDate || 1);
            const isFirstMonth = joinMonth === targetMonth && joinYear === targetYear;

            if (!isFirstMonth && rentPayment.status === 'pending' && today > dueDate) {
                rentPayment.status = 'overdue';
                await rentPayment.save();
            }

            return {
                ...rentPayment.toObject(),
                resident: {
                    id: resident._id,
                    name: resident.name,
                    phone: resident.phone,
                    room: resident.bedId?.roomId?.name,
                    section: resident.bedId?.sectionId?.name !== '_default' ? resident.bedId?.sectionId?.name : null,
                    bed: resident.bedId?.name
                },
                daysOverdue: rentPayment.status === 'overdue'
                    ? Math.floor((today - dueDate) / (1000 * 60 * 60 * 24))
                    : 0
            };
        }))).filter(r => r !== null); // Remove null entries (residents not active in this month)

        // Calculate summary
        const summary = {
            total: rentData.length,
            paid: rentData.filter(r => r.status === 'paid').length,
            pending: rentData.filter(r => r.status === 'pending').length,
            overdue: rentData.filter(r => r.status === 'overdue').length,
            partial: rentData.filter(r => r.status === 'partial').length,
            claimed: rentData.filter(r => r.status === 'claimed').length,
            totalAmount: rentData.reduce((sum, r) => sum + r.amountDue, 0),
            collectedAmount: rentData.reduce((sum, r) => sum + r.amountPaid, 0)
        };

        res.json({ rentData, summary, month: targetMonth, year: targetYear });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get pending rent
router.get('/pending', auth, async (req, res) => {
    try {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const pendingRent = await RentPayment.find({
            pgId: req.pgId,
            month: currentMonth,
            year: currentYear,
            status: { $in: ['pending', 'overdue', 'partial'] }
        }).populate({
            path: 'residentId',
            populate: {
                path: 'bedId',
                populate: [
                    { path: 'roomId', select: 'name' },
                    { path: 'sectionId', select: 'name' }
                ]
            }
        });

        res.json(pendingRent);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Mark rent as paid
router.put('/:id/pay', auth, async (req, res) => {
    try {
        const rentPayment = await RentPayment.findById(req.params.id);
        if (!rentPayment) {
            return res.status(404).json({ message: 'Rent payment not found' });
        }

        // Verify it belongs to this PG
        if (rentPayment.pgId.toString() !== req.pgId.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        rentPayment.status = 'paid';
        rentPayment.amountPaid = rentPayment.amountDue;
        rentPayment.paidDate = new Date();
        await rentPayment.save();

        res.json(rentPayment);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Record partial payment
router.put('/:id/partial', auth, async (req, res) => {
    try {
        const { amount } = req.body;

        const rentPayment = await RentPayment.findById(req.params.id);
        if (!rentPayment) {
            return res.status(404).json({ message: 'Rent payment not found' });
        }

        if (rentPayment.pgId.toString() !== req.pgId.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        rentPayment.amountPaid = (rentPayment.amountPaid || 0) + amount;

        if (rentPayment.amountPaid >= rentPayment.amountDue) {
            rentPayment.status = 'paid';
            rentPayment.paidDate = new Date();
        } else {
            rentPayment.status = 'partial';
        }

        await rentPayment.save();
        res.json(rentPayment);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Mark as claimed (resident says they paid)
router.put('/:id/claim', auth, async (req, res) => {
    try {
        const { claimedAmount } = req.body;

        const rentPayment = await RentPayment.findById(req.params.id);
        if (!rentPayment) {
            return res.status(404).json({ message: 'Rent payment not found' });
        }

        if (rentPayment.pgId.toString() !== req.pgId.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        rentPayment.status = 'claimed';
        rentPayment.claimedAt = new Date();
        rentPayment.notes = `Claimed amount: ₹${claimedAmount || rentPayment.amountDue}`;
        await rentPayment.save();

        res.json(rentPayment);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Confirm claimed payment
router.put('/:id/confirm', auth, async (req, res) => {
    try {
        const { confirmed, amount } = req.body;

        const rentPayment = await RentPayment.findById(req.params.id);
        if (!rentPayment) {
            return res.status(404).json({ message: 'Rent payment not found' });
        }

        if (rentPayment.pgId.toString() !== req.pgId.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        if (confirmed) {
            rentPayment.amountPaid = amount || rentPayment.amountDue;
            if (rentPayment.amountPaid >= rentPayment.amountDue) {
                rentPayment.status = 'paid';
            } else {
                rentPayment.status = 'partial';
            }
            rentPayment.paidDate = new Date();
        } else {
            rentPayment.status = 'pending';
            rentPayment.claimedAt = null;
        }

        await rentPayment.save();
        res.json(rentPayment);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
