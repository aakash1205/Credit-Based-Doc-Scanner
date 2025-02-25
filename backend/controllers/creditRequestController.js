const CreditRequest = require('../models/creditRequestModel');
const User = require('../models/userModel');

// Get all credit requests
exports.getCreditRequests = (req, res) => {
    console.log('Fetching all credit requests...');
    CreditRequest.getAllRequests((err, requests) => {
        if (err) {
            console.error('Error fetching credit requests:', err);
            return res.status(500).json({ message: 'Error retrieving credit requests' });
        }
        console.log('Found credit requests:', requests);
        res.json(requests);
    });
};

// Approve or deny a credit request
exports.manageCreditRequest = async (req, res) => {
    console.log('Received request to manage credit request:', req.params.requestId, req.body);
    const { requestId } = req.params;
    const { action } = req.body;
    
    try {
        // Validate action
        if (!action || !['approve', 'deny'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action specified' });
        }

        const currentRequest = await CreditRequest.getRequestById(requestId);
        
        if (!currentRequest) {
            return res.status(404).json({ message: 'Credit request not found' });
        }

        if (currentRequest.status !== 'pending') {
            return res.status(400).json({ message: 'Request has already been processed' });
        }

        // Get user details using the userId from the request
        User.getUserById(currentRequest.userId, (err, user) => {
            if (err) {
                console.error('Error fetching user:', err);
                return res.status(500).json({ message: 'Error fetching user' });
            }

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Update the request status based on action
            CreditRequest.updateStatus(requestId, action, async (updateErr) => {
                if (updateErr) {
                    return res.status(500).json({ message: 'Error updating request status' });
                }

                // If approved, update user's max daily credits
                if (action === 'approve') {
                    const updates = {
                        maxDailyCredits: currentRequest.amount,
                        dailyCreditsUsed: 0,
                        lastCreditResetDate: new Date().toISOString().split('T')[0]
                    };

                    User.updateUser(user.id, updates, (creditErr) => {
                        if (creditErr) {
                            return res.status(500).json({ message: 'Error updating user credits' });
                        }
                        res.status(200).json({ 
                            message: 'Credit request approved and credits updated successfully',
                            user: { ...user, ...updates }
                        });
                    });
                } else {
                    // If denied, just send success message
                    res.status(200).json({ 
                        message: 'Credit request denied successfully',
                        user
                    });
                }
            });
        });
    } catch (error) {
        console.error('Error managing credit request:', error);
        res.status(500).json({ message: 'Error managing credit request', error: error.message });
    }
};

// Adjust user credits
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

// Create a new credit request
exports.createCreditRequest = (req, res) => {
    const { userId, amount } = req.body;
    const MAX_ALLOWED_CREDITS = 3;

    // Validate requested amount
    if (amount > MAX_ALLOWED_CREDITS) {
        return res.status(400).json({ 
            message: `Cannot request more than ${MAX_ALLOWED_CREDITS} credits`,
            maxAllowed: MAX_ALLOWED_CREDITS
        });
    }

    CreditRequest.createCreditRequest(userId, amount, (err, requestId) => {
        if (err) {
            console.error('Error creating credit request:', err);
            return res.status(500).json({ message: 'Error creating credit request' });
        }
        res.status(201).json({ 
            message: 'Credit request submitted successfully', 
            requestId,
            requestedAmount: amount
        });
    });
}; 