const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL, // Set this in production (e.g. https://hospital-rms.vercel.app)
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const helmet = require('helmet');
app.use(helmet()); // Add BEFORE your routes


// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/allocations', require('./routes/allocations'));
app.use('/api/surgeries', require('./routes/surgeries'));
app.use('/api/reports', require('./routes/reports'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Hospital RMS API is running!', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🏥 Hospital RMS Server running on http://localhost:${PORT}`);
});
