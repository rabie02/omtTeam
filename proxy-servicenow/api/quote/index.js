const express = require('express');
const router = express.Router();

// Import controllers
const getAll = require('../../controllers/Quote/getall')
const update = require('../../controllers/Quote/update')
const create = require('../../controllers/Quote/create')
const deleteQuote = require('../../controllers/Quote/delete')

router.get('/quote', getAll);
router.post('/quote/:id', create);
router.delete('/quote/:id', deleteQuote);
router.patch('/quote', update);

module.exports = router;

