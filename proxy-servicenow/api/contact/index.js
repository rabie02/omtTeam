const express = require('express');
const router = express.Router();

// Import controllers
const create = require('../../controllers/contact/create');

//routes
router.post('/contact', create)

module.exports = router;