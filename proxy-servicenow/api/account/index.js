const express = require('express');
const router = express.Router();

// Import controllers
const getAll = require('../../controllers/account/getall');
const getOne = require('../../controllers/account/getone');

require('dotenv').config();

router.get('/account', getAll);

router.get('/account/:id', getOne);

module.exports = router;