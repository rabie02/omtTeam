const express = require('express');
const router = express.Router();

// Import controllers
const getAll = require('../../controllers/PriceList/getAllPriceList');
const create = require('../../controllers/PriceList/createPriceList');
const update = require('../../controllers/PriceList/updatePriceList');


// Define routes
router.get('/price-list', getAll);
router.post('/price-list', create);
router.patch('/price-list/:id', update);

module.exports = router;