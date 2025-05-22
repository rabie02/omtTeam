const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');

// Import controllers
const getAll = require('../../controllers/ProductOfferingPrice/getAllProductOfferingPrice');
const create = require('../../controllers/ProductOfferingPrice/createProductOfferingPrice');
const deleteProd = require('../../controllers/ProductOfferingPrice/deleteProductOfferingPrice');

// Define routes
router.get('/product-offering-price', getAll);
router.post('/product-offering-price', create);
router.delete('/product-offering-price/:id', deleteProd);

module.exports = router;