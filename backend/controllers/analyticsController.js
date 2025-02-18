const User = require('../models/userModel');

// Get user activity analytics
exports.getUserActivity = async (req, res) => {
    const users = await User.find();
    const activityData = users.map(user => ({
        username: user.username,
        scans: user.scans.length, // Assuming scans are stored in user model
        creditsUsed: 20 - user.credits // Calculate used credits
    }));
    res.json(activityData);
}; 