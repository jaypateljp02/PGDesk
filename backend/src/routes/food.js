const express = require('express');
const Resident = require('../models/Resident');
const auth = require('../middleware/auth');

const router = express.Router();

// Get today's food count
router.get('/today', auth, async (req, res) => {
    try {
        const residents = await Resident.find({
            pgId: req.pgId,
            isActive: true,
            foodEnabled: true
        }).populate({
            path: 'bedId',
            populate: { path: 'roomId', select: 'name' }
        }).sort({ name: 1 });

        const eatingToday = residents.filter(r => !r.isHome).length;
        const wentHome = residents.filter(r => r.isHome).length;

        res.json({
            total: residents.length,
            eatingToday,
            wentHome,
            residents: residents.map(r => ({
                id: r._id,
                name: r.name,
                room: r.bedId?.roomId?.name,
                bed: r.bedId?.name,
                isHome: r.isHome
            }))
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Mark resident as home (not eating)
router.put('/mark-home', auth, async (req, res) => {
    try {
        const { residentIds, isHome } = req.body;

        await Resident.updateMany(
            { _id: { $in: residentIds }, pgId: req.pgId },
            { isHome }
        );

        // Return updated count
        const eatingToday = await Resident.countDocuments({
            pgId: req.pgId,
            isActive: true,
            foodEnabled: true,
            isHome: false
        });

        res.json({
            message: 'Updated successfully',
            eatingToday
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Toggle single resident home status
router.put('/:id/toggle', auth, async (req, res) => {
    try {
        const resident = await Resident.findOne({ _id: req.params.id, pgId: req.pgId });
        if (!resident) {
            return res.status(404).json({ message: 'Resident not found' });
        }

        resident.isHome = !resident.isHome;
        await resident.save();

        // Return updated count
        const eatingToday = await Resident.countDocuments({
            pgId: req.pgId,
            isActive: true,
            foodEnabled: true,
            isHome: false
        });

        res.json({
            resident: { id: resident._id, isHome: resident.isHome },
            eatingToday
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Reset all to eating (new day)
router.put('/reset', auth, async (req, res) => {
    try {
        await Resident.updateMany(
            { pgId: req.pgId, isActive: true, foodEnabled: true },
            { isHome: false }
        );

        const total = await Resident.countDocuments({
            pgId: req.pgId,
            isActive: true,
            foodEnabled: true
        });

        res.json({
            message: 'Reset successful',
            eatingToday: total
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
