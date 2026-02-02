const express = require('express');
const Resident = require('../models/Resident');
const Bed = require('../models/Bed');
const RentPayment = require('../models/RentPayment');
const auth = require('../middleware/auth');

const router = express.Router();

// Get dashboard stats
router.get('/', auth, async (req, res) => {
    try {
        // Total residents
        const totalResidents = await Resident.countDocuments({
            pgId: req.pgId,
            isActive: true
        });

        // Vacant beds
        const totalBeds = await Bed.countDocuments({});
        // We need to get beds from rooms that belong to this PG
        const Room = require('../models/Room');
        const rooms = await Room.find({ pgId: req.pgId });
        const roomIds = rooms.map(r => r._id);

        const vacantBeds = await Bed.countDocuments({
            roomId: { $in: roomIds },
            isOccupied: false
        });

        // Food count (eating today)
        const eatingToday = await Resident.countDocuments({
            pgId: req.pgId,
            isActive: true,
            foodEnabled: true,
            isHome: false
        });

        const totalWithFood = await Resident.countDocuments({
            pgId: req.pgId,
            isActive: true,
            foodEnabled: true
        });

        // Pending rent
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const pendingRent = await RentPayment.countDocuments({
            pgId: req.pgId,
            month: currentMonth,
            year: currentYear,
            status: { $in: ['pending', 'overdue', 'partial'] }
        });

        // Get pending residents for quick access
        const pendingResidents = await RentPayment.find({
            pgId: req.pgId,
            month: currentMonth,
            year: currentYear,
            status: { $in: ['pending', 'overdue', 'partial'] }
        })
            .populate('residentId', 'name phone')
            .limit(5);

        res.json({
            stats: {
                totalResidents,
                vacantBeds,
                eatingToday,
                totalWithFood,
                pendingRent
            },
            quickAccess: {
                pendingResidents: pendingResidents.map(p => ({
                    id: p.residentId?._id,
                    name: p.residentId?.name,
                    phone: p.residentId?.phone,
                    amount: p.amountDue,
                    status: p.status
                }))
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
