const User = require('../models/userModel');
const CreditRequest = require('../models/creditRequestModel');

// Approve or deny a credit request
exports.manageCreditRequest = (req, res) => {
    const { requestId, status } = req.body; // status should be 'approved' or 'denied'
    CreditRequest.updateCreditRequestStatus(requestId, status, (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error updating credit request' });
        }
        if (status === 'approved') {
            // Logic to adjust user credits
            // Fetch the user and update their credits
            CreditRequest.getAllCreditRequests((err, requests) => {
                if (err) {
                    return res.status(500).json({ message: 'Error retrieving requests' });
                }
                const request = requests.find(req => req.id === requestId);
                if (request) {
                    User.getUserById(request.userId, (err, user) => {
                        if (err || !user) {
                            return res.status(404).json({ message: 'User not found' });
                        }
                        user.credits += request.amount; // Add requested credits
                        user.save(); // Save updated credits
                    });
                }
            });
        }
        res.json({ message: 'Credit request updated successfully' });
    });
};

// Get all users
exports.getAllUsers = (req, res) => {
    User.getAllUsers((err, users) => {
        if (err) {
            return res.status(500).json({ message: 'Error retrieving users' });
        }
        res.json(users);
    });
}; 