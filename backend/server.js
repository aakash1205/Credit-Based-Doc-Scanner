const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import CORS
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');
const creditRoutes = require('./routes/creditRoutes'); // Import credit routes
const adminRoutes = require('./routes/adminRoutes'); // Import admin routes
const db = require('./database'); // Ensure this is your SQLite connection
const creditRequestRoutes = require('./routes/creditRequestRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes'); // Add this line
const rateLimit = require('express-rate-limit');

const app = express();

// More flexible CORS configuration
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if(!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:5500',
            'http://127.0.0.1:5500'
        ];
        
        if(allowedOrigins.indexOf(origin) === -1){
            return callback(new Error('CORS policy violation'), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(bodyParser.json());

// Use routes
app.use('/auth', authRoutes);
app.use('/documents', documentRoutes);
app.use('/credits', creditRoutes); // Use credit routes
app.use('/admin', adminRoutes); // Use admin routes
app.use('/credit-requests', creditRequestRoutes);
app.use('/analytics', analyticsRoutes); // Add this line

// Create a limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Apply to analytics routes
app.use('/analytics', apiLimiter);

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        message: 'Internal server error', 
        error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'Server is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});