const express = require('express');
const router = express.Router();

// Import controllers
const create = require('../../controllers/contact/create');
const getByAccount = require('../../controllers/contact/getByAccount');

//routes
router.post('/contact', create)
router.get('/contact/account/:id', getByAccount)

module.exports = router;