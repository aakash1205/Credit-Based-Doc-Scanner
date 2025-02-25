const bcrypt = require('bcrypt');
const User = require('../models/userModel');

// User registration
exports.register = async (req, res) => {
    const { username, password, isAdmin } = req.body;

    try {
        // Check if the username already exists
        const existingUser = await User.getUserByUsername(username); // Now this returns a promise
        if (existingUser) {
            return res.status(400).json({ message: 'Username already taken' });
        }

        // Proceed with registration if username is unique
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = await User.register(username, hashedPassword, isAdmin ? 1 : 0); // Now this returns a promise

        console.log('User registered with ID:', userId);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('User registration error:', err);
        return res.status(400).json({ message: 'User registration failed' });
    }
};

// User login
exports.login = async (req, res) => {
    const { username, password } = req.body;
    console.log('Login attempt for username:', username); // Debug log

    try {
        const user = await User.getUserByUsername(username); // Assuming this function returns a promise
        if (!user) {
            console.log('Login failed: User not found'); // Debug log
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log('User found:', user); // Debug log to see user details

        const match = await bcrypt.compare(password, user.password); // Use await here
        if (match) {
            console.log('User logged in:', user); // Debug log
            res.json({ message: 'User logged in', userId: user.id, isAdmin: user.isAdmin, scanCount: user.scanCount });
        } else {
            console.log('Login failed: Invalid password'); // Debug log
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Login error:', err); // Debug log
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Get user by username
exports.getUserById = async (req, res) => {
    try {
        const { username } = req.query;
        console.log('Fetching user data for username:', username); // Debug log

        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }

        const user = await User.getUserByUsername(username);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Reset daily credits if needed
        await User.resetDailyCreditsIfNeeded(user.id);
        
        // Get fresh user data after potential reset
        const freshUser = await User.getUserByUsername(username);
        
        console.log('Sending user data:', freshUser); // Debug log

        res.json({
            userId: freshUser.id,
            dailyCreditsUsed: freshUser.dailyCreditsUsed || 0,
            maxDailyCredits: freshUser.maxDailyCredits || 3,
            isAdmin: freshUser.isAdmin
        });

    } catch (error) {
        console.error('Error in getUserById:', error);
        res.status(500).json({ 
            message: 'Error fetching user data',
            error: error.message 
        });
    }
};

// In your register admin endpoint
exports.registerAdmin = async (req, res) => {
    const { username, password } = req.body;
    
    // Log the registration attempt
    console.log('Registering admin:', { username, isAdmin: true });

    // Make sure isAdmin is set to 1 (true)
    const sql = `INSERT INTO users (username, password, isAdmin) VALUES (?, ?, 1)`;
    
    // ... rest of the code
};