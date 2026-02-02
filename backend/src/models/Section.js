const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

// Virtual for getting all beds in this section
sectionSchema.virtual('beds', {
    ref: 'Bed',
    localField: '_id',
    foreignField: 'sectionId'
});

sectionSchema.set('toJSON', { virtuals: true });
sectionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Section', sectionSchema);
