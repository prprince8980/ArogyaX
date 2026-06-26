const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware Configurations
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Main App API Routes
app.use('/api/auth', authRoutes);

// Database Bootstrap
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('AroyaX Cluster Connected Perfectly.'))
  .catch((err) => console.error('MongoDB critical handshake error:', err));

app.listen(PORT, () => {
  console.log(`AroyaX Core Engine operational on local port ${PORT}`);
});
