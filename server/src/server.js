const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const apiRoutes = require('./routes');
const db = require('./database/db'); // ensure DB initialized

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(config.UPLOAD_DIR));

// API routes
app.use('/api', apiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'Dayflow HRMS API',
    version: '1.0.0',
    time: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled API Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

app.listen(config.PORT, () => {
  console.log(`========================================`);
  console.log(`  DAYFLOW HRMS BACKEND RUNNING ON PORT ${config.PORT}`);
  console.log(`  Health: http://localhost:${config.PORT}/api/health`);
  console.log(`========================================`);
});
