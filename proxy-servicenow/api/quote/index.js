const express = require('express');
const router = express.Router();

// Import controllers
const getAll = require('../../controllers/Quote/getall')
const getForCase = require('../../controllers/Quote/getForCase')
const update = require('../../controllers/Quote/update')
const create = require('../../controllers/Quote/create')
const deleteQuote = require('../../controllers/Quote/delete')
const updateStatus = require('../../controllers/Quote/updateState')
const getLatestOneByOpportunity = require('../../controllers/Quote/getByOpportunityId');

router.get('/quote', getAll);
router.get('/quotetocase', getForCase);
router.post('/quote/:id', create);
router.delete('/quote/:id', deleteQuote);
router.patch('/quote', update);
router.patch('/quote-state/:id', updateStatus);
router.get('/quote/op/:id',getLatestOneByOpportunity);

module.exports = router;

