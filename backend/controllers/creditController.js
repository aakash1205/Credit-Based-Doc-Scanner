const CreditRequest = require('../models/creditRequestModel');
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

// Submit a credit request
exports.submitCreditRequest = async (req, res) => {
    const { userId, amount } = req.body;

    // Check for existing requests
    const existingRequest = await CreditRequest.getExistingRequest(userId, amount);
    if (existingRequest) {
        return res.status(400).json({ message: 'Duplicate credit request detected.' });
    }

    CreditRequest.createCreditRequest(userId, amount, (err, requestId) => {
        if (err) {
            return res.status(500).json({ message: 'Error submitting credit request' });
        }
        res.status(201).json({ message: 'Credit request submitted successfully', requestId });
    });
};

// Get all credit requests
exports.getAllCreditRequests = (req, res) => {
    CreditRequest.getAllCreditRequests((err, requests) => {
        if (err) {
            return res.status(500).json({ message: 'Error retrieving credit requests' });
        }
        res.json(requests);
    });
};

// Approve or deny a credit request
exports.updateCreditRequest = (req, res) => {
    const { id, status } = req.body; // status should be 'approved' or 'denied'
    CreditRequest.updateCreditRequestStatus(id, status, (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error updating credit request' });
        }
        if (status === 'approved') {
            // Logic to adjust user credits
            // You may want to fetch the user and update their credits here
        }
        res.json({ message: 'Credit request updated successfully' });
    });
};

// Submit a credit request for additional scans
exports.requestAdditionalScans = (req, res) => {
    const { userId, amount } = req.body; // amount can be the number of additional scans requested
    CreditRequest.createCreditRequest(userId, amount, (err, requestId) => {
        if (err) {
            return res.status(500).json({ message: 'Error submitting credit request' });
        }
        res.status(201).json({ message: 'Credit request for additional scans submitted successfully', requestId });
    });
};

exports.adjustUserCredits = (req, res) => {
    const { userId, amount } = req.body;
    User.getUserById(userId, (err, user) => {
        if (err || !user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.credits += amount; // Adjust the credits
        User.updateUser(userId, { credits: user.credits }, (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error updating user credits' });
            }
            res.json({ message: 'User credits updated successfully' });
        });
    });
}; 