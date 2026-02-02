require('dotenv').config();
const mongoose = require('mongoose');
const PG = require('./src/models/PG');

async function checkDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find the most recently created user
        const user = await PG.findOne().sort({ createdAt: -1 });

        if (!user) {
            console.log('No users found in database.');
        } else {
            console.log('--- Latest User Record ---');
            console.log('Email:', user.email);
            console.log('Security Question Exists:', !!user.securityQuestion);
            console.log('Security Question:', user.securityQuestion);
            console.log('Security Answer Exists:', !!user.securityAnswer);
            console.log('Security Answer (Hashed):', user.securityAnswer);
            console.log('--------------------------');

            if (user.securityQuestion && user.securityAnswer) {
                console.log('✅ SUCCESS: Security fields are present in the database.');
            } else {
                console.log('❌ WARNING: Security fields are MISSING for this user.');
                console.log('This is expected if the user was created BEFORE the update.');
                console.log('Please register a NEW user to verify the fix.');
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

checkDatabase();
