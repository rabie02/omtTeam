// routes/productSpecificationRoutes.js
const express = require('express');
const router = express.Router();
const productSpecificationRouter = require('../api/ProductSpecification');

// Mount the product specification router
router.use('/product-specifications', productSpecificationRouter);

module.exports = router;