const path = require('path');
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'dayflow-hrms-super-secret-jwt-key-2026',
  JWT_EXPIRES_IN: '7d',
  DB_PATH: process.env.DB_PATH || path.join(__dirname, '../../data/dayflow.db'),
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'),
  PUBLIC_HOLIDAYS: [
    { date: '2026-01-14', name: 'Kite Festival (Makar Sankranti)' },
    { date: '2026-01-26', name: 'Republic Day' },
    { date: '2026-03-04', name: 'Dhuleti / Holi' },
    { date: '2026-08-15', name: 'Independence Day' },
    { date: '2026-08-28', name: 'Raksha Bandhan' },
    { date: '2026-10-02', name: 'Gandhi Jayanti' },
    { date: '2026-11-08', name: 'Diwali' },
    { date: '2026-11-10', name: 'New Year (Bestu Varas)' },
    { date: '2026-11-11', name: 'Bhai Duj' }
  ]
};
