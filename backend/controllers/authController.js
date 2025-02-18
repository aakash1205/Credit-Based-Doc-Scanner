const bcrypt = require('bcrypt');
const User = require('../models/userModel');

// User registration
exports.register = async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, credits: 20 });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
};

// User login
exports.login = async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
        res.json({ message: 'User logged in', userId: user._id });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
}; 