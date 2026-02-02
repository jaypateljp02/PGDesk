const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const pgSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    ownerName: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    securityQuestion: {
        type: String,
        required: true,
        trim: true
    },
    securityAnswer: {
        type: String,
        required: true,
        trim: true
    },
    language: {
        type: String,
        enum: ['en', 'hi'],
        default: 'en'
    },
    defaultRentCycle: {
        type: String,
        enum: ['fixed', 'individual'],
        default: 'fixed'
    },
    fixedRentDate: {
        type: Number,
        min: 1,
        max: 31,
        default: 1
    },
    defaultFoodEnabled: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Hash password before saving
pgSchema.pre('save', async function () {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    if (this.isModified('securityAnswer')) {
        this.securityAnswer = await bcrypt.hash(this.securityAnswer, 10);
    }
});

// Compare password method
pgSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Compare security answer method
pgSchema.methods.compareSecurityAnswer = async function (candidateAnswer) {
    return await bcrypt.compare(candidateAnswer, this.securityAnswer);
};

module.exports = mongoose.model('PG', pgSchema);
