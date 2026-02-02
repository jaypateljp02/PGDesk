const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    pgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PG',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    hasSections: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Virtual for getting all beds in this room
roomSchema.virtual('beds', {
    ref: 'Bed',
    localField: '_id',
    foreignField: 'roomId'
});

// Virtual for getting all sections in this room
roomSchema.virtual('sections', {
    ref: 'Section',
    localField: '_id',
    foreignField: 'roomId'
});

roomSchema.set('toJSON', { virtuals: true });
roomSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Room', roomSchema);
