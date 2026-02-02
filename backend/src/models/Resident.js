const mongoose = require('mongoose');

const residentSchema = new mongoose.Schema({
    pgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PG',
        required: true
    },
    bedId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bed',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    rentAmount: {
        type: Number,
        required: true,
        min: 0
    },
    rentCycleType: {
        type: String,
        enum: ['fixed', 'individual'],
        default: 'fixed'
    },
    rentDueDate: {
        type: Number,
        min: 1,
        max: 31,
        default: 1
    },
    foodEnabled: {
        type: Boolean,
        default: true
    },
    isHome: {
        type: Boolean,
        default: false  // false = eating at PG, true = went home
    },
    isActive: {
        type: Boolean,
        default: true
    },
    joinDate: {
        type: Date,
        default: Date.now
    },
    vacateDate: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Populate bed details
residentSchema.virtual('bed', {
    ref: 'Bed',
    localField: 'bedId',
    foreignField: '_id',
    justOne: true
});

residentSchema.set('toJSON', { virtuals: true });
residentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Resident', residentSchema);
