const express = require('express');
const router = express.Router();

// Import controllers
const getAll = require('../../controllers/PriceList/getAllPriceList');
const getOne = require('../../controllers/PriceList/getOnePriceList');
const create = require('../../controllers/PriceList/createPriceList');
const deletePrice = require('../../controllers/PriceList/deletePriceList')


// Define routes
router.get('/price-list', getAll);
router.get('/price-list/:id', getOne);
router.post('/price-list', create);
router.delete('/price-list/:id', deletePrice);
router.get('/price-list/:id', getOne);

module.exports = router;