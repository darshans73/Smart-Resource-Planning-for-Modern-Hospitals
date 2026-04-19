const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

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

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Socket connection
io.on('connection', (socket) => {
  console.log('Client connected to real-time socket:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Inject io into req
app.use((req, res, next) => {
  req.io = io;
  next();
});
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
app.use('/api/analytics', require('./routes/analytics'));

// Emergency Push Notification Endpoint
app.post('/api/emergency/notify', (req, res) => {
   const { alertType, message } = req.body;
   if(req.io) {
       req.io.emit('emergency_alert', { alertType, message, timestamp: new Date() });
   }
   res.json({ success: true, message: 'Emergency alert broadcasted globally.' });
});

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
server.listen(PORT, () => {
  console.log(`🏥 Hospital RMS Server running on http://localhost:${PORT} (with WebSockets)`);
});
