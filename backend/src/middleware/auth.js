const jwt = require('jsonwebtoken');
const PG = require('../models/PG');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const pg = await PG.findById(decoded.id).select('-password');

        if (!pg) {
            return res.status(401).json({ message: 'Token is not valid' });
        }

        req.pg = pg;
        req.pgId = pg._id;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = auth;
