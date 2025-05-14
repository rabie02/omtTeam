const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');

// Import controllers
const getAll = require('../../controllers/ProductOfferingPrice/getAllProductOfferingPrice');
const create = require('../../controllers/ProductOfferingPrice/createProductOfferingPrice');
const update = require('../../controllers/ProductOfferingPrice/updateProductOfferingPrice');

// Define routes
router.get('/product-offering-price', getAll);
router.post('/product-offering-price', create);
router.patch('/product-offering-price/:id', update);

module.exports = router;