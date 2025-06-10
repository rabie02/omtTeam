const express = require('express');
const router = express.Router();

// Import controllers
const getAll = require('../../controllers/ProductOfferingPrice/getAllProductOfferingPrice');
const getByPL = require('../../controllers/ProductOfferingPrice/getProductOfferingPriceByPriceList')
const create = require('../../controllers/ProductOfferingPrice/createProductOfferingPrice');
const deleteProd = require('../../controllers/ProductOfferingPrice/deleteProductOfferingPrice');

// Define routes
router.get('/product-offering-price', getAll);
router.post('/product-offering-price', create);
router.delete('/product-offering-price/:id', deleteProd);
router.get('/product-offering-price-pl/:id',getByPL);

module.exports = router;