// api/ProductSpecification/index.js
const express = require('express');
const router = express.Router();

// Import controllers
// const getAll = require('../../controllers/quota/getall')
// const create = require('../../controllers/quota/create')
const update = require('../../controllers/quota/update')

// router.get('/quota', getAll);
// router.post('/quota', create);
router.patch('/quote/:id', update);

module.exports = router;