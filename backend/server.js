const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const creditRoutes = require('./routes/creditRoutes');
const documentRoutes = require('./routes/documentRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Connect to MongoDB (or your chosen database)
mongoose.connect('mongodb://localhost:27017/document-scanning', { useNewUrlParser: true, useUnifiedTopology: true });

// Use routes
app.use('/auth', authRoutes);
app.use('/credits', creditRoutes);
app.use('/documents', documentRoutes);
app.use('/analytics', analyticsRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}); 