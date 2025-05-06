const express = require('express');
const router = express.Router();

// Import controllers
const getAll = require('../../controllers/ProductOfferingCatalog/getall');
const getOne = require('../../controllers/ProductOfferingCatalog/getone');
const create = require('../../controllers/ProductOfferingCatalog/create');
const update = require('../../controllers/ProductOfferingCatalog/update');
const deleteHandler = require('../../controllers/ProductOfferingCatalog/delete');
const updateStatus = require('../../controllers/ProductOfferingCatalog/updateStatus');

// Define routes
router.get('/product-offering-catalog', getAll);
router.get('/product-offering-catalog/:id', getOne);
router.post('/product-offering-catalog', create);
router.patch('/product-offering-catalog/:id', update);
router.patch('/product-offering-catalog-status/:id', updateStatus);
router.delete('/product-offering-catalog/:id', deleteHandler);

module.exports = router;