const express = require('express');
const Room = require('../models/Room');
const Section = require('../models/Section');
const Bed = require('../models/Bed');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all rooms with beds count
router.get('/', auth, async (req, res) => {
    try {
        const rooms = await Room.find({ pgId: req.pgId });

        // Get bed counts for each room
        const roomsWithCounts = await Promise.all(rooms.map(async (room) => {
            const totalBeds = await Bed.countDocuments({ roomId: room._id });
            const occupiedBeds = await Bed.countDocuments({ roomId: room._id, isOccupied: true });

            return {
                ...room.toObject(),
                totalBeds,
                occupiedBeds,
                vacantBeds: totalBeds - occupiedBeds
            };
        }));

        res.json(roomsWithCounts);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create a new room
router.post('/', auth, async (req, res) => {
    try {
        const { name, hasSections } = req.body;

        const room = new Room({
            pgId: req.pgId,
            name,
            hasSections: hasSections || false
        });

        await room.save();

        // If no sections, create a default hidden section
        if (!hasSections) {
            const defaultSection = new Section({
                roomId: room._id,
                name: '_default'
            });
            await defaultSection.save();
        }

        res.status(201).json(room);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get room details with sections and beds
router.get('/:id', auth, async (req, res) => {
    try {
        const room = await Room.findOne({ _id: req.params.id, pgId: req.pgId });

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const sections = await Section.find({ roomId: room._id });

        // Get beds for each section with resident info
        const sectionsWithBeds = await Promise.all(sections.map(async (section) => {
            const beds = await Bed.find({ sectionId: section._id })
                .populate({
                    path: 'resident',
                    match: { isActive: true },
                    select: 'name phone rentAmount'
                });

            return {
                ...section.toObject(),
                beds
            };
        }));

        // Filter out default section for simple rooms
        const visibleSections = room.hasSections
            ? sectionsWithBeds
            : sectionsWithBeds.filter(s => s.name === '_default');

        const totalBeds = await Bed.countDocuments({ roomId: room._id });
        const occupiedBeds = await Bed.countDocuments({ roomId: room._id, isOccupied: true });

        res.json({
            ...room.toObject(),
            sections: room.hasSections ? sectionsWithBeds : [],
            beds: !room.hasSections && visibleSections[0] ? visibleSections[0].beds : [],
            totalBeds,
            occupiedBeds,
            vacantBeds: totalBeds - occupiedBeds
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update room
router.put('/:id', auth, async (req, res) => {
    try {
        const { name } = req.body;

        const room = await Room.findOneAndUpdate(
            { _id: req.params.id, pgId: req.pgId },
            { name },
            { new: true }
        );

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        res.json(room);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete room
router.delete('/:id', auth, async (req, res) => {
    try {
        const room = await Room.findOne({ _id: req.params.id, pgId: req.pgId });

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Check if any beds are occupied
        const occupiedBeds = await Bed.countDocuments({ roomId: room._id, isOccupied: true });
        if (occupiedBeds > 0) {
            return res.status(400).json({ message: 'Cannot delete room with occupied beds' });
        }

        // Delete all beds, sections, and the room
        await Bed.deleteMany({ roomId: room._id });
        await Section.deleteMany({ roomId: room._id });
        await room.deleteOne();

        res.json({ message: 'Room deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add section to room
router.post('/:id/sections', auth, async (req, res) => {
    try {
        const { name } = req.body;

        const room = await Room.findOne({ _id: req.params.id, pgId: req.pgId });
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (!room.hasSections) {
            return res.status(400).json({ message: 'Room does not have sections enabled' });
        }

        const section = new Section({
            roomId: room._id,
            name
        });

        await section.save();
        res.status(201).json(section);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add beds to room/section
router.post('/:id/beds', auth, async (req, res) => {
    try {
        const { sectionId, beds } = req.body; // beds: [{ name, rent }]

        const room = await Room.findOne({ _id: req.params.id, pgId: req.pgId });
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // If room has sections, sectionId is required
        // If room doesn't have sections, use default section
        let targetSectionId = sectionId;
        if (!room.hasSections) {
            const defaultSection = await Section.findOne({ roomId: room._id, name: '_default' });
            targetSectionId = defaultSection._id;
        }

        const createdBeds = await Promise.all(beds.map(async (bed) => {
            const newBed = new Bed({
                roomId: room._id,
                sectionId: targetSectionId,
                name: bed.name,
                rent: bed.rent
            });
            await newBed.save();
            return newBed;
        }));

        res.status(201).json(createdBeds);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update bed
router.put('/beds/:bedId', auth, async (req, res) => {
    try {
        const { name, rent } = req.body;

        const bed = await Bed.findById(req.params.bedId);
        if (!bed) {
            return res.status(404).json({ message: 'Bed not found' });
        }

        // Verify room belongs to this PG
        const room = await Room.findOne({ _id: bed.roomId, pgId: req.pgId });
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (name) bed.name = name;
        if (rent !== undefined) bed.rent = rent;

        await bed.save();
        res.json(bed);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete bed
router.delete('/beds/:bedId', auth, async (req, res) => {
    try {
        const bed = await Bed.findById(req.params.bedId);
        if (!bed) {
            return res.status(404).json({ message: 'Bed not found' });
        }

        // Verify room belongs to this PG
        const room = await Room.findOne({ _id: bed.roomId, pgId: req.pgId });
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Check if bed is occupied
        if (bed.isOccupied) {
            return res.status(400).json({ message: 'Cannot delete an occupied bed' });
        }

        await bed.deleteOne();
        res.json({ message: 'Bed deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
