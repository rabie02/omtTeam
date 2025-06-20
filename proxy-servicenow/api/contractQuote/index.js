const express = require('express');
const router = express.Router();

// Import controllers
const getContractModel = require('../../controllers/ContractQuote/getAllContractModel');
const create = require('../../controllers/ContractQuote/create');

router.post('/contract-quote/', create);
router.get('/contract-model/', getContractModel);

module.exports = router;

