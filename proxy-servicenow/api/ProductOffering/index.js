const express = require('express');
const router = express.Router();

// Import controllers
const getAll = require('../../controllers/ProductOffering/getall');
const getAllService = require('../../controllers/ProductOffering/getAllSnow');

const getOne = require('../../controllers/ProductOffering/getone');
const create = require('../../controllers/ProductOffering/create');
const update = require('../../controllers/ProductOffering/update');
const updateStatus = require('../../controllers/ProductOffering/updateStatus');
const deleteHandler = require('../../controllers/ProductOffering/delete');

// Define routes
router.get('/product-offering', getAll);
router.get('/product-offering-sn', getAllService);

router.get('/product-offering/:id', getOne);
router.post('/product-offering', create);
router.patch('/product-offering/:id', update);
router.patch('/product-offering-status', updateStatus);
router.delete('/product-offering/:id', deleteHandler);

module.exports = router;