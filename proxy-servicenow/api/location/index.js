const express = require('express');
const router = express.Router();

// Import controllers
const create = require('../../controllers/location/create');
const getall = require('../../controllers/location/getall');
const delLocation = require('../../controllers/location/delete');
const getAdresse = require('../../controllers/location/getAdresse');
const deleteLocation = require('../../controllers/location/delete');
const getAll = require('../../controllers/location/getall');



//routes
router.post('/location', create);
router.get('/reverse-geocode', getAdresse);
router.delete('/location/:id',deleteLocation);
router.get('/location', getAll);


module.exports = router;