const mongoose = require('mongoose');

const rentPaymentSchema = new mongoose.Schema({
    residentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resident',
        required: true
    },
    pgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PG',
        required: true
    },
    month: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    year: {
        type: Number,
        required: true
    },
    amountDue: {
        type: Number,
        required: true,
        min: 0
    },
    amountPaid: {
        type: Number,
        default: 0,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'partial', 'overdue', 'claimed'],
        default: 'pending'
    },
    paidDate: {
        type: Date,
        default: null
    },
    claimedAt: {
        type: Date,
        default: null
    },
    notes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Compound index for unique rent per resident per month
rentPaymentSchema.index({ residentId: 1, month: 1, year: 1 }, { unique: true });

rentPaymentSchema.set('toJSON', { virtuals: true });
rentPaymentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('RentPayment', rentPaymentSchema);
