const User = require('../models/userModel');

// Middleware to check if user is admin
exports.isAdmin = (req, res, next) => {
    const userId = req.user.id; // Assuming you have user ID in req.user
    User.getUserById(userId, (err, user) => {
        if (err || !user || user.isAdmin !== 1) {
            return res.status(403).json({ message: 'Access denied' });
        }
        next(); // User is admin, proceed to the next middleware/route
    });
}; 