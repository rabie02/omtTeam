const express = require('express');
const router = express.Router();

// Import controllers
const create = require('../../controllers/location/create');
const getAdresse = require('../../controllers/location/getAdresse');

//routes
router.post('/location', create);
router.get('/reverse-geocode', getAdresse);

module.exports = router;