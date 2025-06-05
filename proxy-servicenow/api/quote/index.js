const express = require('express');
const router = express.Router();

// Import controllers
const getAll = require('../../controllers/quote/getall')
const update = require('../../controllers/quote/update')
const create = require('../../controllers/quote/create')
const deleteQuote = require('../../controllers/quote/delete')
const getLatestOneByOpportunity = require('../../controllers/quote/getLatestQuoteByOpportunity');

router.get('/quote', getAll);
router.post('/quote/:id', create);
router.delete('/quote', deleteQuote);
router.patch('/quote', update);
router.get('/quote/op/:id',getLatestOneByOpportunity);

module.exports = router;

