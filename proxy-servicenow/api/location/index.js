const express = require('express');
const router = express.Router();

// Import controllers
const create = require('../../controllers/location/create');
const getall = require('../../controllers/location/getall');
const delLocation = require('../../controllers/location/delete');
const getAdresse = require('../../controllers/location/getAdresse');

//routes
router.post('/location', create);
router.get('/reverse-geocode', getAdresse);
router.get('/location', getall);
router.get('/location/:id', delLocation);





module.exports = router;