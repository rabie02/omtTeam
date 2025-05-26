const express = require('express');
const router = express.Router();

// Import controllers
const getAll = require('../../controllers/ProductOfferingCategory/getall');
const getOne = require('../../controllers/ProductOfferingCategory/getone');
const create = require('../../controllers/ProductOfferingCategory/create');
const update = require('../../controllers/ProductOfferingCategory/update');
const updateStatus = require('../../controllers/ProductOfferingCategory/updateStatus')

const deleteHandler = require('../../controllers/ProductOfferingCategory/delete');
// const createRelation = require('../../controllers/CatalogCategroyRelationship/create');
// Define routes
router.get('/product-offering-category', getAll);
router.get('/product-offering-category/:id', getOne);
router.post('/product-offering-category', create);
router.patch('/product-offering-category/:id', update);
router.patch('/product-offering-category-status/:id', updateStatus);
// router.patch('/product-offering-category-status', updateStatus);
// router.post('/category-catalog-relation', createRelation);
router.delete('/product-offering-category/:id', deleteHandler);



module.exports = router;