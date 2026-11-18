const express = require('express');
const upload = require('../middleware/upload');
const { detect, getHistory, getDiagnosisById, sendReport } = require('../controllers/detectController');
const { optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', optionalAuth, upload.single('image'), detect);
router.post('/send-report', optionalAuth, sendReport);
router.get('/history', optionalAuth, getHistory);
router.get('/:id', optionalAuth, getDiagnosisById);

module.exports = router;
