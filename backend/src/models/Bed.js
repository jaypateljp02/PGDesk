const mongoose = require('mongoose');

const bedSchema = new mongoose.Schema({
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    sectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section',
        default: null
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    rent: {
        type: Number,
        required: true,
        min: 0
    },
    isOccupied: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Virtual for getting the current resident
bedSchema.virtual('resident', {
    ref: 'Resident',
    localField: '_id',
    foreignField: 'bedId',
    justOne: true,
    match: { isActive: true }
});

bedSchema.set('toJSON', { virtuals: true });
bedSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Bed', bedSchema);
