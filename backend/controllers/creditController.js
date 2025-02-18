const User = require('../models/userModel');

// Request additional credits
exports.requestCredits = async (req, res) => {
    const { userId, amount } = req.body;
    const user = await User.findById(userId);
    // Logic to handle credit requests
    res.json({ message: 'Credit request submitted' });
};

// Reset daily credits
exports.resetDailyCredits = async () => {
    const users = await User.find();
    users.forEach(user => {
        user.credits = 20; // Reset to daily limit
        user.save();
    });
}; 