const express = require('express');
const router = express.Router();

// Import controllers

const getContractModel = require('../../controllers/ContractQuote/getAllContractModel');

router.get('/contract-model/', getContractModel);

module.exports = router;

