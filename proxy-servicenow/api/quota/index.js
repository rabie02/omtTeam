// api/ProductSpecification/index.js
const express = require('express');
const router = express.Router();

// Import controllers
// const getAll = require('../../controllers/quota/getall')
const syncQuoteFromServiceNow = require('../../controllers/quota/create')

// router.get('/quota', getAll);
router.post('/quota', syncQuoteFromServiceNow);

module.exports = router;