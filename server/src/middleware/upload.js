const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(config.UPLOAD_DIR)) {
      fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });
    }
    cb(null, config.UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images and documents (PDF, JPG, PNG, DOCX)
  const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowedMime.includes(file.mimetype) || file.originalname.match(/\.(jpg|jpeg|png|svg|pdf|docx)$/i)) {
    cb(null, true);
  } else {
    cb(new Error('Only images and PDF/DOC documents are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

module.exports = upload;
