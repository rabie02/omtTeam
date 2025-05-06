const express = require('express');
const router = express.Router();

// Import controllers
const getAll = require('../../controllers/CustomerOrder/getall');
const create = require('../../controllers/CustomerOrder/create');


// Define routes
router.get('/customer-order', getAll);
router.post('/customer-order', create);

module.exports = router;