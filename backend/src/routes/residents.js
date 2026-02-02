const express = require('express');
const Resident = require('../models/Resident');
const Bed = require('../models/Bed');
const Room = require('../models/Room');
const Section = require('../models/Section');
const RentPayment = require('../models/RentPayment');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all residents
router.get('/', auth, async (req, res) => {
    try {
        const { status, search } = req.query;

        let query = { pgId: req.pgId, isActive: true };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const residents = await Resident.find(query)
            .populate({
                path: 'bedId',
                populate: [
                    { path: 'roomId', select: 'name' },
                    { path: 'sectionId', select: 'name' }
                ]
            })
            .sort({ name: 1 });

        // Get current month rent status for each resident
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const residentsWithRent = await Promise.all(residents.map(async (resident) => {
            const rentPayment = await RentPayment.findOne({
                residentId: resident._id,
                month: currentMonth,
                year: currentYear
            });

            return {
                ...resident.toObject(),
                currentRentStatus: rentPayment?.status || 'pending',
                room: resident.bedId?.roomId,
                section: resident.bedId?.sectionId,
                bed: resident.bedId
            };
        }));

        // Filter by rent status if specified
        let filteredResidents = residentsWithRent;
        if (status && status !== 'all') {
            filteredResidents = residentsWithRent.filter(r => r.currentRentStatus === status);
        }

        res.json(filteredResidents);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get vacant beds
router.get('/vacant-beds', auth, async (req, res) => {
    try {
        const rooms = await Room.find({ pgId: req.pgId });

        const vacantBeds = await Promise.all(rooms.map(async (room) => {
            const beds = await Bed.find({ roomId: room._id, isOccupied: false })
                .populate('sectionId', 'name');

            return beds.map(bed => ({
                ...bed.toObject(),
                roomName: room.name,
                sectionName: bed.sectionId?.name !== '_default' ? bed.sectionId?.name : null
            }));
        }));

        res.json(vacantBeds.flat());
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add new resident
router.post('/', auth, async (req, res) => {
    try {
        const { name, phone, bedId, rentAmount, rentCycleType, rentDueDate, foodEnabled } = req.body;

        // Verify bed exists and is vacant
        const bed = await Bed.findById(bedId);
        if (!bed) {
            return res.status(404).json({ message: 'Bed not found' });
        }

        // Verify bed belongs to this PG
        const room = await Room.findOne({ _id: bed.roomId, pgId: req.pgId });
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (bed.isOccupied) {
            return res.status(400).json({ message: 'Bed is already occupied' });
        }

        // Get PG settings for defaults
        const pgSettings = req.pg;

        const resident = new Resident({
            pgId: req.pgId,
            bedId,
            name,
            phone,
            rentAmount: rentAmount || bed.rent,
            rentCycleType: rentCycleType || pgSettings.defaultRentCycle,
            rentDueDate: rentDueDate || pgSettings.fixedRentDate,
            foodEnabled: foodEnabled !== undefined ? foodEnabled : pgSettings.defaultFoodEnabled,
            joinDate: new Date()
        });

        await resident.save();

        // Mark bed as occupied
        bed.isOccupied = true;
        await bed.save();

        // Create rent payment for current month
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const rentPayment = new RentPayment({
            residentId: resident._id,
            pgId: req.pgId,
            month: currentMonth,
            year: currentYear,
            amountDue: resident.rentAmount,
            status: 'pending'
        });
        await rentPayment.save();

        res.status(201).json(resident);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get resident profile
router.get('/:id', auth, async (req, res) => {
    try {
        const resident = await Resident.findOne({ _id: req.params.id, pgId: req.pgId })
            .populate({
                path: 'bedId',
                populate: [
                    { path: 'roomId', select: 'name' },
                    { path: 'sectionId', select: 'name' }
                ]
            });

        if (!resident) {
            return res.status(404).json({ message: 'Resident not found' });
        }

        // Get rent history - only from join month to current month
        const joinDate = new Date(resident.joinDate);
        const currentDate = new Date();
        const joinMonth = joinDate.getMonth() + 1;
        const joinYear = joinDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        const rentHistory = await RentPayment.find({
            residentId: resident._id,
            $or: [
                // Years between join and current (exclusive of current year)
                {
                    year: { $gt: joinYear, $lt: currentYear }
                },
                // Join year - months >= join month
                {
                    year: joinYear,
                    month: { $gte: joinMonth },
                    ...(joinYear === currentYear ? { month: { $gte: joinMonth, $lte: currentMonth } } : {})
                },
                // Current year (if different from join year) - months <= current month
                ...(currentYear !== joinYear ? [{
                    year: currentYear,
                    month: { $lte: currentMonth }
                }] : [])
            ]
        }).sort({ year: -1, month: -1 });

        res.json({
            ...resident.toObject(),
            room: resident.bedId?.roomId,
            section: resident.bedId?.sectionId,
            bed: resident.bedId,
            rentHistory
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update resident
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, phone, rentAmount, rentCycleType, rentDueDate, foodEnabled } = req.body;

        const resident = await Resident.findOne({ _id: req.params.id, pgId: req.pgId });
        if (!resident) {
            return res.status(404).json({ message: 'Resident not found' });
        }

        if (name) resident.name = name;
        if (phone) resident.phone = phone;
        if (rentAmount !== undefined) resident.rentAmount = rentAmount;
        if (rentCycleType) resident.rentCycleType = rentCycleType;
        if (rentDueDate) resident.rentDueDate = rentDueDate;
        if (foodEnabled !== undefined) resident.foodEnabled = foodEnabled;

        await resident.save();
        res.json(resident);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Vacate resident
router.post('/:id/vacate', auth, async (req, res) => {
    try {
        const resident = await Resident.findOne({ _id: req.params.id, pgId: req.pgId });
        if (!resident) {
            return res.status(404).json({ message: 'Resident not found' });
        }

        // Mark resident as inactive
        resident.isActive = false;
        resident.vacateDate = new Date();
        await resident.save();

        // Mark bed as vacant
        const bed = await Bed.findById(resident.bedId);
        if (bed) {
            bed.isOccupied = false;
            await bed.save();
        }

        res.json({ message: 'Resident vacated successfully', resident });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
