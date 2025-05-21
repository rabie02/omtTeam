const express = require('express');
const router = express.Router();

const { sendVerificationToken, verifyToken } = require('./api/complete_info');



// Auth routes
router.post('/complet-info', sendVerificationToken);
router.get('/complet-info', sendVerificationToken);
router.get('/verify-token', verifyToken);

module.exports = router;
