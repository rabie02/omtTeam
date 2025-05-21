const express = require('express');
const router = express.Router();

// Import controllers
const getAll = require('../../controllers/quote/getall')
const update = require('../../controllers/quote/update')
const create = require('../../controllers/quote/create')
const deleteQuote = require('../../controllers/quote/delete')

router.get('/quote', getAll);
router.post('/quote', create);
router.delete('/quote/:sysId', deleteQuote);
router.patch('/quote', update);

module.exports = router;

