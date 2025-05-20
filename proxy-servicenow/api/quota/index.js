// api/ProductSpecification/index.js
const express = require('express');
const router = express.Router();

// Import controllers
const getAll = require('../../controllers/quote/getall')
const create = require('../../controllers/quote/create')
const deleteQuote = require('../../controllers/quote/delete')

router.get('/quote', getAll);
router.post('/quote', create);
router.delete('/quote/:sysId', deleteQuote);

module.exports = router;