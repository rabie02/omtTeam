// api/ProductSpecification/index.js
const express = require('express');
const router = express.Router();

// Import controllers
const getAll = require('../../controllers/quota/getall')


router.get('/quota', getAll);


module.exports = router;