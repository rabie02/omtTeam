const express = require('express');
const router = express.Router();

// Import controllers
const getAll = require('../../controllers/ProductOfferingCatalog/getall');
const getPublish = require('../../controllers/ProductOfferingCatalog/getpublish');
const getOne = require('../../controllers/ProductOfferingCatalog/getbydetails');
const create = require('../../controllers/ProductOfferingCatalog/create');
const update = require('../../controllers/ProductOfferingCatalog/update');
const updateStatus = require('../../controllers/ProductOfferingCatalog/updateStatus')
const deleteHandler = require('../../controllers/ProductOfferingCatalog/delete');


// Define routes
router.get('/product-offering-catalog', getAll);
router.get('/product-offering-catalog-publish', getPublish);
router.get('/product-offering-catalog/:id', getOne);
router.post('/product-offering-catalog', create);
router.patch('/product-offering-catalog/:id', update);
router.patch('/product-offering-catalog-status/:id', updateStatus);
router.delete('/product-offering-catalog/:id', deleteHandler);

module.exports = router;