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

        // Optimize: Fetch all rent payments for this month in one go
        const existingPayments = await RentPayment.find({
            pgId: req.pgId,
            month: targetMonth,
            year: targetYear
        });

        const paymentMap = new Map();
        existingPayments.forEach(p => paymentMap.set(p.residentId.toString(), p));

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

            let rentPayment = paymentMap.get(resident._id.toString());

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

// AUTO-CREATE RENT for new month (call this on 1st of every month)
router.post('/auto-create', auth, async (req, res) => {
    try {
        const { month, year } = req.body;
        const targetMonth = parseInt(month) || new Date().getMonth() + 1;
        const targetYear = parseInt(year) || new Date().getFullYear();

        // Get all active residents
        const residents = await Resident.find({ pgId: req.pgId, isActive: true });

        let created = 0;
        let skipped = 0;

        for (const resident of residents) {
            const joinDate = new Date(resident.joinDate);
            const joinMonth = joinDate.getMonth() + 1;
            const joinYear = joinDate.getFullYear();

            // Skip if target month is before join date
            if (targetYear < joinYear || (targetYear === joinYear && targetMonth < joinMonth)) {
                skipped++;
                continue;
            }

            // Check if rent already exists
            const existingRent = await RentPayment.findOne({
                residentId: resident._id,
                pgId: req.pgId,
                month: targetMonth,
                year: targetYear
            });

            if (!existingRent) {
                await RentPayment.create({
                    residentId: resident._id,
                    pgId: req.pgId,
                    month: targetMonth,
                    year: targetYear,
                    amountDue: resident.rentAmount,
                    amountPaid: 0,
                    status: 'pending'
                });
                created++;
            } else {
                skipped++;
            }
        }

        res.json({
            success: true,
            message: `Created ${created} rent record(s), skipped ${skipped}`,
            month: targetMonth,
            year: targetYear,
            created,
            skipped
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get rent summary for multiple months (for reports/analytics)
router.get('/summary', auth, async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const months = [];

        // Get last 6 months summary
        for (let i = 0; i < 6; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const month = date.getMonth() + 1;
            const year = date.getFullYear();

            const payments = await RentPayment.find({
                pgId: req.pgId,
                month,
                year
            });

            const summary = {
                month,
                year,
                monthName: date.toLocaleString('default', { month: 'short' }),
                total: payments.length,
                paid: payments.filter(p => p.status === 'paid').length,
                pending: payments.filter(p => ['pending', 'overdue', 'partial'].includes(p.status)).length,
                totalAmount: payments.reduce((sum, p) => sum + (p.amountDue || 0), 0),
                collectedAmount: payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0)
            };

            months.push(summary);
        }

        res.json({ months });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
